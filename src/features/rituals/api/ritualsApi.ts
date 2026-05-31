import type { PostgrestError } from "@supabase/supabase-js";

import { DEFAULT_RITUAL_HISTORY_LIMIT } from "@/features/rituals/constants";
import {
  completeRitualResultRowSchema,
  completeRitualSchema,
  coupleRitualWithTemplateRowSchema,
  coupleRitualWithTemplateRowsSchema,
  ensureDailyRitualResultRowSchema,
  ritualCompletionsSchema,
  ritualCoupleIdSchema,
  ritualCurrentUserIdSchema,
  ritualHistoryLimitSchema,
  ritualIdSchema,
  toCanonicalRitualDay,
} from "@/features/rituals/schemas";
import type {
  CompleteRitualInput,
  CompleteRitualResult,
  CoupleRitual,
  RitualCompletion,
  RitualDetail,
  RitualHistoryItem,
  RitualRevealState,
  RitualTemplate,
  TodayRitualState,
} from "@/features/rituals/types";
import {
  RitualActionError,
  getRitualErrorMessage,
  toRitualActionError,
} from "@/lib/errors/ritualErrorMessages";
import { supabase } from "@/lib/supabase/client";

const RITUAL_TEMPLATE_SELECT = `
  id,
  title,
  description,
  category,
  prompt,
  input_type,
  is_active,
  created_at
`;

const COUPLE_RITUAL_WITH_TEMPLATE_SELECT = `
  id,
  couple_id,
  ritual_template_id,
  scheduled_for,
  status,
  created_at,
  updated_at,
  ritual_template:ritual_templates(${RITUAL_TEMPLATE_SELECT})
`;

const RITUAL_COMPLETION_SELECT = `
  id,
  couple_ritual_id,
  user_id,
  text_response,
  media_asset_id,
  created_at,
  updated_at
`;

function throwIfRitualError(error: PostgrestError | null): void {
  if (error) {
    throw toRitualActionError(error);
  }
}

async function getCoupleRitualWithTemplate(coupleRitualId: string): Promise<{
  coupleRitual: CoupleRitual;
  template: RitualTemplate;
}> {
  const { data, error } = await supabase
    .from("couple_rituals")
    .select(COUPLE_RITUAL_WITH_TEMPLATE_SELECT)
    .eq("id", coupleRitualId)
    .maybeSingle();

  throwIfRitualError(error);

  if (!data) {
    throw new RitualActionError("unknown");
  }

  const parsedRitual = coupleRitualWithTemplateRowSchema.parse(data);
  if (!parsedRitual.ritual_template) {
    throw new RitualActionError("unknown");
  }

  const { ritual_template: template, ...coupleRitual } = parsedRitual;

  return {
    coupleRitual,
    template,
  };
}

async function getRitualCompletions(coupleRitualId: string): Promise<RitualCompletion[]> {
  const { data, error } = await supabase
    .from("ritual_completions")
    .select(RITUAL_COMPLETION_SELECT)
    .eq("couple_ritual_id", coupleRitualId)
    .order("created_at", { ascending: true });

  throwIfRitualError(error);

  return ritualCompletionsSchema.parse(data ?? []);
}

function buildRitualRevealState(
  coupleRitual: CoupleRitual,
  completions: RitualCompletion[],
  currentUserId: string
): RitualRevealState {
  const myCompletion = completions.find((completion) => completion.user_id === currentUserId);
  const isRevealed = coupleRitual.status === "completed";
  const hasCompleted = Boolean(myCompletion);

  return {
    isRevealed,
    hasCompleted,
    isWaitingForPartner: hasCompleted && !isRevealed,
    completedCount: completions.length,
  };
}

export async function ensureTodayRitual(scheduledFor?: string): Promise<string> {
  try {
    const canonicalRitualDay = toCanonicalRitualDay(scheduledFor);

    const { data, error } = await supabase.rpc("ensure_daily_ritual", {
      p_scheduled_for: canonicalRitualDay,
    });

    throwIfRitualError(error);

    const firstRow = data?.[0];
    if (!firstRow) {
      throw new RitualActionError("unknown");
    }

    const parsedResult = ensureDailyRitualResultRowSchema.parse(firstRow);
    return parsedResult.couple_ritual_id;
  } catch (error) {
    throw toRitualActionError(error);
  }
}

export async function getRitualDetail(
  coupleRitualId: string,
  currentUserId: string
): Promise<RitualDetail> {
  try {
    const parsedRitualId = ritualIdSchema.parse(coupleRitualId);
    const parsedCurrentUserId = ritualCurrentUserIdSchema.parse(currentUserId);

    const { coupleRitual, template } = await getCoupleRitualWithTemplate(parsedRitualId);
    const completions = await getRitualCompletions(parsedRitualId);

    const myCompletion = completions.find((completion) => completion.user_id === parsedCurrentUserId) ?? null;
    const partnerCompletion =
      completions.find((completion) => completion.user_id !== parsedCurrentUserId) ?? null;
    const revealState = buildRitualRevealState(coupleRitual, completions, parsedCurrentUserId);

    return {
      coupleRitual,
      template,
      myCompletion,
      partnerCompletion,
      revealState,
    };
  } catch (error) {
    throw toRitualActionError(error);
  }
}

export async function getTodayRitualState(
  coupleId: string,
  currentUserId: string
): Promise<TodayRitualState> {
  try {
    const parsedCoupleId = ritualCoupleIdSchema.parse(coupleId);
    const parsedCurrentUserId = ritualCurrentUserIdSchema.parse(currentUserId);
    const coupleRitualId = await ensureTodayRitual();
    const ritualDetail = await getRitualDetail(coupleRitualId, parsedCurrentUserId);

    if (ritualDetail.coupleRitual.couple_id !== parsedCoupleId) {
      return {
        status: "unavailable",
        message: getRitualErrorMessage("no_active_couple"),
      };
    }

    if (ritualDetail.revealState.isRevealed) {
      return {
        status: "revealed",
        ritual: ritualDetail,
      };
    }

    if (ritualDetail.revealState.isWaitingForPartner) {
      return {
        status: "completed_by_me_waiting",
        ritual: ritualDetail,
      };
    }

    return {
      status: "not_started",
      ritual: ritualDetail,
    };
  } catch (error) {
    const ritualError = toRitualActionError(error);
    if (ritualError.code === "no_active_couple" || ritualError.code === "not_paired_yet") {
      return {
        status: "unavailable",
        message: ritualError.message,
      };
    }

    return {
      status: "error",
      message: ritualError.message,
    };
  }
}

export async function completeRitual(input: CompleteRitualInput): Promise<CompleteRitualResult> {
  try {
    const parsedInput = completeRitualSchema.parse(input);

    const { data, error } = await supabase.rpc("complete_ritual", {
      p_couple_ritual_id: parsedInput.coupleRitualId,
      p_text_response: parsedInput.textResponse ?? undefined,
      p_media_asset_id: parsedInput.mediaAssetId ?? undefined,
    });

    throwIfRitualError(error);

    const firstRow = data?.[0];
    if (!firstRow) {
      throw new RitualActionError("unknown");
    }

    return completeRitualResultRowSchema.parse(firstRow);
  } catch (error) {
    throw toRitualActionError(error);
  }
}

export async function getRitualHistory(
  coupleId: string,
  limit: number = DEFAULT_RITUAL_HISTORY_LIMIT
): Promise<RitualHistoryItem[]> {
  try {
    const parsedCoupleId = ritualCoupleIdSchema.parse(coupleId);
    const parsedLimit = ritualHistoryLimitSchema.parse(limit);

    const { data, error } = await supabase
      .from("couple_rituals")
      .select(COUPLE_RITUAL_WITH_TEMPLATE_SELECT)
      .eq("couple_id", parsedCoupleId)
      .order("scheduled_for", { ascending: false })
      .limit(parsedLimit);

    throwIfRitualError(error);

    const parsedRows = coupleRitualWithTemplateRowsSchema.parse(data ?? []);

    return parsedRows.map((ritualRow) => {
      const { ritual_template: template, ...coupleRitual } = ritualRow;
      return {
        coupleRitual,
        template,
        isRevealed: coupleRitual.status === "completed",
      };
    });
  } catch (error) {
    throw toRitualActionError(error);
  }
}

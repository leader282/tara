import type { PostgrestError } from "@supabase/supabase-js";

import { DEFAULT_CAPSULE_UNLOCK_TIME } from "@/features/capsules/constants";
import {
  capsuleCoupleIdSchema,
  capsuleCurrentUserIdSchema,
  capsuleIdSchema,
  createCapsuleSchema,
  memoryCapsuleContentRowSchema,
  memoryCapsuleRowSchema,
  memoryCapsuleRowsSchema,
  openCapsuleSchema,
} from "@/features/capsules/schemas";
import type {
  CapsuleDetail,
  CapsuleListItem,
  CapsuleUnlockState,
  CreateCapsuleInput,
  MemoryCapsule,
} from "@/features/capsules/types";
import {
  CapsuleActionError,
  toCapsuleActionError,
} from "@/lib/errors/capsuleErrorMessages";
import { parseDateTimeFromFields } from "@/lib/dates/format";
import { supabase } from "@/lib/supabase/client";

type SubscribeToCapsuleMetadataParams = {
  coupleId: string;
  onInsert?: (capsule: MemoryCapsule) => void;
  onUpdate?: (capsule: MemoryCapsule) => void;
  onError?: (error: CapsuleActionError) => void;
};

const MEMORY_CAPSULE_SELECT = `
  id,
  couple_id,
  creator_id,
  title,
  unlock_type,
  unlock_at,
  emotional_context,
  opened_by,
  opened_at,
  created_at,
  updated_at
`;

const MEMORY_CAPSULE_CONTENT_SELECT = `
  capsule_id,
  note,
  media_asset_id,
  created_at,
  updated_at
`;

const REALTIME_SUBSCRIPTION_ERROR_MESSAGE =
  "Live capsule updates are temporarily unavailable. We'll refresh again soon.";

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function getUnlockState(capsule: MemoryCapsule, now: Date = new Date()): CapsuleUnlockState {
  const openedAt = toDate(capsule.opened_at);
  if (openedAt) {
    return "opened";
  }

  const unlockAt = toDate(capsule.unlock_at);
  if (!unlockAt) {
    return "locked";
  }

  if (unlockAt.getTime() <= now.getTime()) {
    return "ready_to_open";
  }

  return "locked";
}

function toCapsuleListItem(capsule: MemoryCapsule, currentUserId: string): CapsuleListItem {
  const unlockAt = toDate(capsule.unlock_at);
  const unlockState = getUnlockState(capsule);
  const isCreatedByMe = capsule.creator_id === currentUserId;
  const isOpened = unlockState === "opened";
  const canOpen = unlockState === "ready_to_open";

  if (!unlockAt) {
    return {
      capsule,
      status: "unavailable",
      unlockState,
      isCreatedByMe,
      isOpened,
      canOpen: false,
    };
  }

  if (isOpened) {
    return {
      capsule,
      status: "opened",
      unlockState,
      isCreatedByMe,
      isOpened: true,
      canOpen: false,
    };
  }

  if (isCreatedByMe) {
    return {
      capsule,
      status: "created_by_me",
      unlockState,
      isCreatedByMe,
      isOpened: false,
      canOpen,
    };
  }

  if (canOpen) {
    return {
      capsule,
      status: "openable",
      unlockState,
      isCreatedByMe,
      isOpened: false,
      canOpen: true,
    };
  }

  return {
    capsule,
    status: "locked",
    unlockState,
    isCreatedByMe,
    isOpened: false,
    canOpen: false,
  };
}

function toCapsuleDetailStatus(
  capsule: MemoryCapsule,
  currentUserId: string
): CapsuleDetail["status"] {
  if (toDate(capsule.opened_at)) {
    return "opened";
  }

  const unlockAt = toDate(capsule.unlock_at);
  if (unlockAt && unlockAt.getTime() <= Date.now()) {
    return "openable";
  }

  if (capsule.creator_id === currentUserId) {
    return "creator_preview";
  }

  return "locked";
}

function throwIfCapsuleError(error: PostgrestError | null): void {
  if (error) {
    throw toCapsuleActionError(error);
  }
}

export async function createMemoryCapsule(input: CreateCapsuleInput): Promise<MemoryCapsule> {
  try {
    const parsedInput = createCapsuleSchema.parse(input);
    const unlockAtIso = parseDateTimeFromFields(
      parsedInput.unlockDate,
      parsedInput.unlockTime,
      DEFAULT_CAPSULE_UNLOCK_TIME
    );

    if (!unlockAtIso) {
      throw new CapsuleActionError("unlock_date_in_past");
    }

    const unlockAt = new Date(unlockAtIso);
    if (Number.isNaN(unlockAt.getTime()) || unlockAt.getTime() <= Date.now()) {
      throw new CapsuleActionError("unlock_date_in_past");
    }

    const { data, error } = await supabase.rpc("create_memory_capsule", {
      p_title: parsedInput.title,
      p_note: parsedInput.note ?? undefined,
      p_unlock_at: unlockAtIso,
      p_emotional_context: parsedInput.emotionalContext ?? undefined,
      p_media_asset_id: parsedInput.mediaAssetId ?? undefined,
    });

    throwIfCapsuleError(error);

    const firstRow = data?.[0];
    if (!firstRow) {
      throw new CapsuleActionError("unknown");
    }

    return memoryCapsuleRowSchema.parse(firstRow);
  } catch (error) {
    throw toCapsuleActionError(error);
  }
}

export async function getCapsules(
  coupleId: string,
  currentUserId: string
): Promise<CapsuleListItem[]> {
  try {
    const parsedCoupleId = capsuleCoupleIdSchema.parse(coupleId);
    const parsedCurrentUserId = capsuleCurrentUserIdSchema.parse(currentUserId);

    const { data, error } = await supabase
      .from("memory_capsules")
      .select(MEMORY_CAPSULE_SELECT)
      .eq("couple_id", parsedCoupleId)
      .order("unlock_at", { ascending: true })
      .order("created_at", { ascending: false });

    throwIfCapsuleError(error);

    const capsules = memoryCapsuleRowsSchema.parse(data ?? []);
    return capsules.map((capsule) => toCapsuleListItem(capsule, parsedCurrentUserId));
  } catch (error) {
    throw toCapsuleActionError(error);
  }
}

export async function getCapsuleDetail(
  capsuleId: string,
  currentUserId: string
): Promise<CapsuleDetail> {
  try {
    const parsedCapsuleId = capsuleIdSchema.parse(capsuleId);
    const parsedCurrentUserId = capsuleCurrentUserIdSchema.parse(currentUserId);

    const { data: capsuleData, error: capsuleError } = await supabase
      .from("memory_capsules")
      .select(MEMORY_CAPSULE_SELECT)
      .eq("id", parsedCapsuleId)
      .maybeSingle();

    throwIfCapsuleError(capsuleError);

    if (!capsuleData) {
      throw new CapsuleActionError("capsule_not_found");
    }

    const capsule = memoryCapsuleRowSchema.parse(capsuleData);

    const { data: contentData, error: contentError } = await supabase
      .from("memory_capsule_contents")
      .select(MEMORY_CAPSULE_CONTENT_SELECT)
      .eq("capsule_id", parsedCapsuleId)
      .maybeSingle();

    throwIfCapsuleError(contentError);

    const content = contentData ? memoryCapsuleContentRowSchema.parse(contentData) : null;

    return {
      capsule,
      content,
      status: toCapsuleDetailStatus(capsule, parsedCurrentUserId),
      unlockState: getUnlockState(capsule),
      isCreatedByMe: capsule.creator_id === parsedCurrentUserId,
      canReadContent: content !== null,
    };
  } catch (error) {
    throw toCapsuleActionError(error);
  }
}

export async function openMemoryCapsule(capsuleId: string): Promise<MemoryCapsule> {
  try {
    const parsedInput = openCapsuleSchema.parse({ capsuleId });

    const { data, error } = await supabase.rpc("open_memory_capsule", {
      p_capsule_id: parsedInput.capsuleId,
    });

    throwIfCapsuleError(error);

    const firstRow = data?.[0];
    if (!firstRow) {
      throw new CapsuleActionError("unknown");
    }

    return memoryCapsuleRowSchema.parse(firstRow);
  } catch (error) {
    throw toCapsuleActionError(error);
  }
}

export function subscribeToCapsuleMetadata({
  coupleId,
  onInsert,
  onUpdate,
  onError,
}: SubscribeToCapsuleMetadataParams): () => void {
  const parsedCoupleIdResult = capsuleCoupleIdSchema.safeParse(coupleId);
  if (!parsedCoupleIdResult.success) {
    onError?.(new CapsuleActionError("unknown", REALTIME_SUBSCRIPTION_ERROR_MESSAGE));
    return () => {};
  }

  const parsedCoupleId = parsedCoupleIdResult.data;
  const channel = supabase
    .channel(`capsule-metadata-${parsedCoupleId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "memory_capsules",
        filter: `couple_id=eq.${parsedCoupleId}`,
      },
      (payload) => {
        const parsedCapsule = memoryCapsuleRowSchema.safeParse(payload.new);
        if (!parsedCapsule.success) {
          return;
        }

        if (parsedCapsule.data.couple_id !== parsedCoupleId) {
          return;
        }

        onInsert?.(parsedCapsule.data);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "memory_capsules",
        filter: `couple_id=eq.${parsedCoupleId}`,
      },
      (payload) => {
        const parsedCapsule = memoryCapsuleRowSchema.safeParse(payload.new);
        if (!parsedCapsule.success) {
          return;
        }

        if (parsedCapsule.data.couple_id !== parsedCoupleId) {
          return;
        }

        onUpdate?.(parsedCapsule.data);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(new CapsuleActionError("network_error", REALTIME_SUBSCRIPTION_ERROR_MESSAGE));
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

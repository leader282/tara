import type { PostgrestError } from "@supabase/supabase-js";

import {
  presenceEventSchema,
  presenceEventsSchema,
  recentPresencePulseCoupleIdSchema,
  recentPresencePulseLimitSchema,
  sendPresencePulseSchema,
} from "@/features/presence/schemas";
import type { PresenceEvent, RecentPresencePulse, SendPresencePulseInput } from "@/features/presence/types";
import {
  PresenceActionError,
  getPresenceErrorMessage,
  toPresenceActionMessage,
} from "@/lib/errors/presenceErrorMessages";
import { supabase } from "@/lib/supabase/client";

type SubscribeToPresencePulsesParams = {
  coupleId: string;
  onInsert: (pulse: RecentPresencePulse) => void;
  onError?: (error: PresenceActionError) => void;
};

const DEFAULT_RECENT_PULSES_LIMIT = 10;
const REALTIME_SUBSCRIPTION_ERROR_MESSAGE =
  "Live pulse updates are temporarily unavailable. We will refresh as soon as possible.";

function throwIfPresenceError(error: PostgrestError | null): void {
  if (error) {
    throw new PresenceActionError(getPresenceErrorMessage(error));
  }
}

function toPresenceEvent(value: unknown): PresenceEvent {
  return presenceEventSchema.parse(value);
}

export async function sendPresencePulse(input: SendPresencePulseInput): Promise<PresenceEvent> {
  try {
    const parsedInput = sendPresencePulseSchema.parse(input);
    const rpcOptionalMessage =
      parsedInput.optionalMessage === null ? undefined : parsedInput.optionalMessage;

    const { data, error } = await supabase.rpc("send_presence_pulse", {
      p_type: parsedInput.type,
      p_optional_message: rpcOptionalMessage,
    });

    throwIfPresenceError(error);

    const firstRow = data?.[0];
    if (!firstRow) {
      throw new PresenceActionError();
    }

    return toPresenceEvent(firstRow);
  } catch (error) {
    if (error instanceof PresenceActionError) {
      throw error;
    }

    throw new PresenceActionError(toPresenceActionMessage(error));
  }
}

export async function getRecentPresencePulses(
  coupleId: string,
  limit: number = DEFAULT_RECENT_PULSES_LIMIT
): Promise<RecentPresencePulse[]> {
  try {
    const parsedCoupleId = recentPresencePulseCoupleIdSchema.parse(coupleId);
    const parsedLimit = recentPresencePulseLimitSchema.parse(limit);

    const { data, error } = await supabase
      .from("presence_events")
      .select("id, couple_id, sender_id, type, optional_message, created_at")
      .eq("couple_id", parsedCoupleId)
      .order("created_at", { ascending: false })
      .limit(parsedLimit);

    throwIfPresenceError(error);

    return presenceEventsSchema.parse(data ?? []);
  } catch (error) {
    if (error instanceof PresenceActionError) {
      throw error;
    }

    throw new PresenceActionError(toPresenceActionMessage(error));
  }
}

export function subscribeToPresencePulses({
  coupleId,
  onInsert,
  onError,
}: SubscribeToPresencePulsesParams): () => void {
  const parsedCoupleIdResult = recentPresencePulseCoupleIdSchema.safeParse(coupleId);
  if (!parsedCoupleIdResult.success) {
    onError?.(new PresenceActionError(REALTIME_SUBSCRIPTION_ERROR_MESSAGE));
    return () => {};
  }

  const parsedCoupleId = parsedCoupleIdResult.data;
  const channel = supabase
    .channel(`presence-events-${parsedCoupleId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "presence_events",
        filter: `couple_id=eq.${parsedCoupleId}`,
      },
      (payload) => {
        const parsedPulse = presenceEventSchema.safeParse(payload.new);
        if (!parsedPulse.success) {
          return;
        }

        const nextPulse = parsedPulse.data;
        if (nextPulse.couple_id !== parsedCoupleId) {
          return;
        }

        onInsert(nextPulse);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(new PresenceActionError(REALTIME_SUBSCRIPTION_ERROR_MESSAGE));
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

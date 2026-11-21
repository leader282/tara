import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import type {
  PRESENCE_PULSE_OPTIONS_LIST,
  PresencePulseTypeValue,
} from "@/features/presence/constants";
import type { Tables } from "@/lib/supabase/database.types";

export type PresencePulseType = PresencePulseTypeValue;

export type PresencePulseOption = (typeof PRESENCE_PULSE_OPTIONS_LIST)[number];

export type PresenceEvent = Omit<Tables<"presence_events">, "type"> & {
  type: PresencePulseType;
};

export type SendPresencePulseInput = {
  type: PresencePulseType;
  optionalMessage?: string | null;
};

export type RecentPresencePulse = PresenceEvent;

export type PresenceInsertPayload = RealtimePostgresInsertPayload<Tables<"presence_events">>;

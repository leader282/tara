import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import type { PresencePulseTypeValue } from "@/features/presence/constants";
import type { Tables } from "@/lib/supabase/database.types";

export type PresencePulseType = PresencePulseTypeValue;

export type PresencePulseOption = {
  type: PresencePulseType;
  label: string;
  shortLabel: string;
  description: string;
  accessibilityLabel: string;
  iconText?: string;
};

export type PresenceEvent = Omit<Tables<"presence_events">, "type"> & {
  type: PresencePulseType;
};

export type SendPresencePulseInput = {
  type: PresencePulseType;
  optionalMessage?: string | null;
};

export type RecentPresencePulse = PresenceEvent;

export type PresenceInsertPayload = RealtimePostgresInsertPayload<Tables<"presence_events">>;

export type IncomingPulseState = {
  isVisible: boolean;
  pulse: RecentPresencePulse | null;
};

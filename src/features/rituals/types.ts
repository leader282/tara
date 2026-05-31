import type { Tables, Database } from "@/lib/supabase/database.types";
import type {
  PHASE8_SUPPORTED_RITUAL_INPUT_TYPES,
  RITUAL_CATEGORIES,
  RITUAL_INPUT_TYPES,
} from "@/features/rituals/constants";

export type RitualCategory = (typeof RITUAL_CATEGORIES)[number];
export type RitualInputType = (typeof RITUAL_INPUT_TYPES)[number];
export type Phase8SupportedRitualInputType =
  (typeof PHASE8_SUPPORTED_RITUAL_INPUT_TYPES)[number];

export type RitualTemplate = Omit<Tables<"ritual_templates">, "category" | "input_type"> & {
  category: RitualCategory;
  input_type: RitualInputType;
};

export type CoupleRitual = Tables<"couple_rituals">;
export type RitualCompletion = Tables<"ritual_completions">;

export type RitualRevealState = {
  isRevealed: boolean;
  hasCompleted: boolean;
  isWaitingForPartner: boolean;
  completedCount: number;
};

export type RitualDetail = {
  coupleRitual: CoupleRitual;
  template: RitualTemplate;
  myCompletion: RitualCompletion | null;
  partnerCompletion: RitualCompletion | null;
  revealState: RitualRevealState;
};

export type RitualHistoryItem = {
  coupleRitual: CoupleRitual;
  template: RitualTemplate | null;
  isRevealed: boolean;
};

export type CompleteRitualInput = {
  coupleRitualId: string;
  textResponse: string;
};

export type CompleteRitualResult =
  Database["public"]["Functions"]["complete_ritual"]["Returns"][number];
export type EnsureDailyRitualResult =
  Database["public"]["Functions"]["ensure_daily_ritual"]["Returns"][number];

type TodayRitualWithDetailState = {
  ritual: RitualDetail;
};

export type TodayRitualState =
  | { status: "loading" }
  | { status: "unavailable"; message: string | null }
  | ({ status: "not_started" } & TodayRitualWithDetailState)
  | ({ status: "completed_by_me_waiting" } & TodayRitualWithDetailState)
  | ({ status: "revealed" } & TodayRitualWithDetailState)
  | ({
      status: "unsupported_photo";
      message: string;
    } & TodayRitualWithDetailState)
  | { status: "error"; message: string };

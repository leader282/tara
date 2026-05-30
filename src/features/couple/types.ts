import type { ActiveInvite } from "@/features/invite/types";
import type { Tables } from "@/lib/supabase/database.types";

export type Couple = Tables<"couples">;
export type CoupleMember = Tables<"couple_members">;

export type ActiveCoupleLoadedState =
  | { status: "none" }
  | {
      status: "waiting";
      couple: Couple;
      members: CoupleMember[];
      invite?: ActiveInvite | null;
    }
  | {
      status: "paired";
      couple: Couple;
      members: CoupleMember[];
    };

export type ActiveCoupleState = { status: "loading" } | ActiveCoupleLoadedState;

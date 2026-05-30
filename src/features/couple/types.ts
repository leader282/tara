import type { ActiveInvite } from "@/features/invite/types";
import type { Tables } from "@/lib/supabase/database.types";

export type Couple = Tables<"couples">;
export type CoupleMember = Tables<"couple_members">;
export type CoupleProfile = Tables<"profiles">;

export type PartnerProfileSummary = Pick<
  CoupleProfile,
  "id" | "display_name" | "avatar_url" | "timezone" | "city" | "country"
>;

export type CoupleHomeData = {
  couple: Couple;
  currentUserProfile: PartnerProfileSummary;
  partnerProfile: PartnerProfileSummary;
  partnerMember: CoupleMember;
  nextMeetupAt: Couple["next_meetup_at"];
  nextMeetupLocation: Couple["next_meetup_location"];
  anniversaryDate: Couple["anniversary_date"];
};

export type CoupleHomeStatus = "none" | "waiting" | "paired" | "invariant_error";

export type CoupleHomeResult =
  | { status: "none" }
  | {
      status: "waiting";
      couple: Couple;
      members: CoupleMember[];
    }
  | {
      status: "paired";
      data: CoupleHomeData;
    }
  | {
      status: "invariant_error";
      message: string;
      details?: string;
    };

export type EditMeetupInput = {
  meetupDate?: string;
  meetupTime?: string;
  meetupLocation?: string | null;
  clearMeetup?: boolean;
};

export type UpdateNextMeetupInput = {
  coupleId: string;
  nextMeetupAt: string | null;
  nextMeetupLocation: string | null;
};

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

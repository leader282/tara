import type { Tables } from "@/lib/supabase/database.types";

export type CoupleInvite = Tables<"couple_invites">;

export type ActiveInvite = Pick<
  CoupleInvite,
  "id" | "couple_id" | "invite_code" | "status" | "expires_at" | "created_at"
>;

export type CreateCoupleInput = {
  anniversaryDate?: string;
};

export type CreateCoupleWithInviteResult = {
  couple_id: string;
  invite_id: string;
  invite_code: string;
  expires_at: string;
};

export type AcceptCoupleInviteResult = {
  couple_id: string;
};

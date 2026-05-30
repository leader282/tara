import { activeCoupleIdSchema, activeCoupleUserIdSchema } from "@/features/couple/schemas";
import type { ActiveCoupleLoadedState, Couple, CoupleMember } from "@/features/couple/types";
import { getActiveInviteForCouple } from "@/features/invite/api/inviteApi";
import { supabase } from "@/lib/supabase/client";

function throwIfSupabaseError(errorMessage: string | null | undefined): void {
  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

async function getCurrentUserActiveMembership(userId: string): Promise<CoupleMember | null> {
  const { data, error } = await supabase
    .from("couple_members")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(2);

  throwIfSupabaseError(error?.message);

  if (!data || data.length === 0) {
    return null;
  }

  if (data.length > 1) {
    throw new Error("A user can only belong to one active couple.");
  }

  return data[0];
}

async function getActiveCoupleById(coupleId: string): Promise<Couple> {
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .eq("id", coupleId)
    .eq("status", "active")
    .maybeSingle();

  throwIfSupabaseError(error?.message);

  if (!data) {
    throw new Error("Active couple was not found for this membership.");
  }

  return data;
}

async function getActiveCoupleMembers(coupleId: string): Promise<CoupleMember[]> {
  const { data, error } = await supabase
    .from("couple_members")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  throwIfSupabaseError(error?.message);

  return data ?? [];
}

export async function getActiveCoupleState(userId: string): Promise<ActiveCoupleLoadedState> {
  const parsedUserId = activeCoupleUserIdSchema.parse(userId);

  const activeMembership = await getCurrentUserActiveMembership(parsedUserId);
  if (!activeMembership) {
    return { status: "none" };
  }

  const parsedCoupleId = activeCoupleIdSchema.parse(activeMembership.couple_id);
  const couple = await getActiveCoupleById(parsedCoupleId);
  const members = await getActiveCoupleMembers(parsedCoupleId);

  if (members.length === 1) {
    const invite = await getActiveInviteForCouple(parsedCoupleId);

    return {
      status: "waiting",
      couple,
      members,
      invite,
    };
  }

  if (members.length === 2) {
    return {
      status: "paired",
      couple,
      members,
    };
  }

  if (members.length > 2) {
    throw new Error("Couple membership exceeded two active partners.");
  }

  throw new Error("Active couple membership is missing required members.");
}

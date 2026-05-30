import type { PostgrestError } from "@supabase/supabase-js";

import { activeCoupleUserIdSchema, updateNextMeetupSchema } from "@/features/couple/schemas";
import type {
  Couple,
  CoupleHomeData,
  CoupleHomeResult,
  CoupleMember,
  PartnerProfileSummary,
  UpdateNextMeetupInput,
} from "@/features/couple/types";
import {
  CoupleActionError,
  getCoupleErrorMessage,
  toCoupleActionMessage,
} from "@/lib/errors/coupleErrorMessages";
import { supabase } from "@/lib/supabase/client";

function throwIfSupabaseError(error: PostgrestError | null): void {
  if (error) {
    throw new CoupleActionError(getCoupleErrorMessage(error));
  }
}

async function getCurrentUserActiveMemberships(userId: string): Promise<CoupleMember[]> {
  const { data, error } = await supabase
    .from("couple_members")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(2);

  throwIfSupabaseError(error);
  return data ?? [];
}

async function getActiveCouple(coupleId: string): Promise<Couple | null> {
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .eq("id", coupleId)
    .eq("status", "active")
    .maybeSingle();

  throwIfSupabaseError(error);
  return data;
}

async function getActiveCoupleMembers(coupleId: string): Promise<CoupleMember[]> {
  const { data, error } = await supabase
    .from("couple_members")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  throwIfSupabaseError(error);
  return data ?? [];
}

async function getProfilesById(userIds: string[]): Promise<PartnerProfileSummary[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, timezone, city, country")
    .in("id", userIds);

  throwIfSupabaseError(error);
  return data ?? [];
}

export async function getCoupleHomeData(userId: string): Promise<CoupleHomeResult> {
  try {
    const parsedUserId = activeCoupleUserIdSchema.parse(userId);
    const memberships = await getCurrentUserActiveMemberships(parsedUserId);

    if (memberships.length === 0) {
      return { status: "none" };
    }

    if (memberships.length > 1) {
      return {
        status: "invariant_error",
        message: "A user has more than one active couple membership.",
      };
    }

    const currentMembership = memberships[0];
    const couple = await getActiveCouple(currentMembership.couple_id);
    if (!couple) {
      return { status: "none" };
    }

    const activeMembers = await getActiveCoupleMembers(couple.id);

    if (activeMembers.length === 1) {
      return {
        status: "waiting",
        couple,
        members: activeMembers,
      };
    }

    if (activeMembers.length > 2) {
      return {
        status: "invariant_error",
        message: "Couple membership exceeded two active partners.",
      };
    }

    if (activeMembers.length !== 2) {
      return {
        status: "invariant_error",
        message: "Couple membership is missing required active members.",
      };
    }

    const currentMember = activeMembers.find((member) => member.user_id === parsedUserId);
    if (!currentMember) {
      return {
        status: "invariant_error",
        message: "Current user is not an active member of the resolved couple.",
      };
    }

    const partnerMember = activeMembers.find((member) => member.user_id !== parsedUserId);
    if (!partnerMember) {
      return {
        status: "invariant_error",
        message: "Partner membership could not be resolved for this couple.",
      };
    }

    const profiles = await getProfilesById([parsedUserId, partnerMember.user_id]);
    const currentUserProfile = profiles.find((profile) => profile.id === parsedUserId);
    const partnerProfile = profiles.find((profile) => profile.id === partnerMember.user_id);

    if (!currentUserProfile || !partnerProfile) {
      return {
        status: "invariant_error",
        message: "Required profile rows are missing for this paired couple.",
      };
    }

    const data: CoupleHomeData = {
      couple,
      currentUserProfile,
      partnerProfile,
      partnerMember,
      nextMeetupAt: couple.next_meetup_at,
      nextMeetupLocation: couple.next_meetup_location,
      anniversaryDate: couple.anniversary_date,
    };

    return {
      status: "paired",
      data,
    };
  } catch (error) {
    if (error instanceof CoupleActionError) {
      throw error;
    }

    throw new CoupleActionError(toCoupleActionMessage(error));
  }
}

export async function updateNextMeetup(input: UpdateNextMeetupInput): Promise<Couple> {
  try {
    const parsedInput = updateNextMeetupSchema.parse(input);

    const { data, error } = await supabase
      .from("couples")
      .update({
        next_meetup_at: parsedInput.nextMeetupAt,
        next_meetup_location: parsedInput.nextMeetupLocation,
      })
      .eq("id", parsedInput.coupleId)
      .select("*")
      .maybeSingle();

    throwIfSupabaseError(error);

    if (!data) {
      throw new CoupleActionError("We couldn't update your reunion details right now.");
    }

    return data;
  } catch (error) {
    if (error instanceof CoupleActionError) {
      throw error;
    }

    throw new CoupleActionError(toCoupleActionMessage(error));
  }
}

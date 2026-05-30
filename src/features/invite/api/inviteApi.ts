import type { PostgrestError } from "@supabase/supabase-js";

import {
  acceptCoupleInviteResultSchema,
  acceptInviteSchema,
  activeInviteSchema,
  createCoupleSchema,
  createCoupleWithInviteResultSchema,
  inviteCoupleIdSchema,
} from "@/features/invite/schemas";
import type {
  AcceptCoupleInviteResult,
  ActiveInvite,
  CreateCoupleInput,
  CreateCoupleWithInviteResult,
} from "@/features/invite/types";
import {
  InviteActionError,
  getInviteErrorMessage,
  toInviteActionMessage,
} from "@/lib/errors/inviteErrorMessages";
import { supabase } from "@/lib/supabase/client";

function throwIfInviteError(error: PostgrestError | null): void {
  if (error) {
    throw new InviteActionError(getInviteErrorMessage(error));
  }
}

export function normalizeInviteCode(input: string): string {
  return input.trim().replace(/\s+/g, "");
}

export function buildInviteMessage(inviteCode: string, inviteLink?: string): string {
  const normalizedCode = normalizeInviteCode(inviteCode);
  const fallbackLine = "If the link doesn't open, paste this code in Tara on the Join screen.";

  if (inviteLink) {
    return [
      "Join me on Tara, our private emotional space for two.",
      `Invite code: ${normalizedCode}`,
      `Open invite link: ${inviteLink}`,
      fallbackLine,
    ].join("\n");
  }

  return [
    "Join me on Tara, our private emotional space for two.",
    `Invite code: ${normalizedCode}`,
    fallbackLine,
  ].join("\n");
}

export async function createCoupleWithInvite(
  input: CreateCoupleInput = {}
): Promise<CreateCoupleWithInviteResult> {
  try {
    const parsedInput = createCoupleSchema.parse(input);

    const { data, error } = await supabase.rpc("create_couple_with_invite", {
      p_anniversary_date: parsedInput.anniversaryDate,
      p_next_meetup_at: undefined,
      p_next_meetup_location: undefined,
    });

    throwIfInviteError(error);

    const firstRow = data?.[0];
    if (!firstRow) {
      throw new InviteActionError();
    }

    return createCoupleWithInviteResultSchema.parse(firstRow);
  } catch (error) {
    if (error instanceof InviteActionError) {
      throw error;
    }

    throw new InviteActionError(toInviteActionMessage(error));
  }
}

export async function acceptCoupleInvite(inviteCode: string): Promise<AcceptCoupleInviteResult> {
  try {
    const parsedInput = acceptInviteSchema.parse({
      inviteCode: normalizeInviteCode(inviteCode),
    });

    const { data, error } = await supabase.rpc("accept_couple_invite", {
      p_invite_code: parsedInput.inviteCode,
    });

    throwIfInviteError(error);

    const firstRow = data?.[0];
    if (!firstRow) {
      throw new InviteActionError();
    }

    return acceptCoupleInviteResultSchema.parse(firstRow);
  } catch (error) {
    if (error instanceof InviteActionError) {
      throw error;
    }

    throw new InviteActionError(toInviteActionMessage(error));
  }
}

export async function getActiveInviteForCouple(coupleId: string): Promise<ActiveInvite | null> {
  try {
    const parsedCoupleId = inviteCoupleIdSchema.parse(coupleId);
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("couple_invites")
      .select("id, couple_id, invite_code, status, expires_at, created_at")
      .eq("couple_id", parsedCoupleId)
      .eq("status", "active")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    throwIfInviteError(error);

    if (!data) {
      return null;
    }

    return activeInviteSchema.parse(data);
  } catch (error) {
    if (error instanceof InviteActionError) {
      throw error;
    }

    throw new InviteActionError(toInviteActionMessage(error));
  }
}

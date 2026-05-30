import type { PostgrestError } from "@supabase/supabase-js";

export const defaultInviteErrorMessage =
  "We couldn't complete this invite step right now. Please try again.";

const invalidInviteErrorMessage =
  "This invite is no longer available. Ask your partner for a fresh invite code.";
const expiredInviteErrorMessage =
  "This invite has expired. Ask your partner for a new invite code.";
const acceptedInviteErrorMessage =
  "This invite was already accepted. Ask your partner to create a new one.";
const revokedInviteErrorMessage =
  "This invite is no longer active. Ask your partner for a fresh invite code.";
const ownInviteErrorMessage = "You can't accept your own invite code.";
const coupleFullErrorMessage =
  "This couple space already has two partners, so no additional joins are possible.";
const activeCoupleExistsErrorMessage =
  "You already have an active couple space on this account.";
const inviteNetworkErrorMessage =
  "Connection looks unstable. Please check your internet and try again.";

export class InviteActionError extends Error {
  constructor(message: string = defaultInviteErrorMessage) {
    super(message);
    this.name = "InviteActionError";
  }
}

function isPostgrestError(error: unknown): error is PostgrestError {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "message" in error && "code" in error;
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function getInviteErrorMessage(error: PostgrestError | null): string {
  if (!error) {
    return defaultInviteErrorMessage;
  }

  const normalizedMessage = error.message.toLowerCase();
  const normalizedDetails = (error.details ?? "").toLowerCase();
  const normalizedHint = (error.hint ?? "").toLowerCase();
  const searchableText = `${normalizedMessage} ${normalizedDetails} ${normalizedHint}`;

  if (
    includesAny(searchableText, [
      "already has an active couple",
      "one_active_couple_per_user",
    ])
  ) {
    return activeCoupleExistsErrorMessage;
  }

  if (
    includesAny(searchableText, [
      "at most two active members",
      "already full",
      "couple can have at most two active members",
    ])
  ) {
    return coupleFullErrorMessage;
  }

  if (
    includesAny(searchableText, [
      "cannot accept your own invite",
      "own invite",
    ])
  ) {
    return ownInviteErrorMessage;
  }

  if (includesAny(searchableText, ["expired"])) {
    return expiredInviteErrorMessage;
  }

  if (includesAny(searchableText, ["already accepted"])) {
    return acceptedInviteErrorMessage;
  }

  if (includesAny(searchableText, ["revoked"])) {
    return revokedInviteErrorMessage;
  }

  if (
    error.code === "P0001" ||
    includesAny(searchableText, ["invalid invite", "no longer available"])
  ) {
    return invalidInviteErrorMessage;
  }

  return defaultInviteErrorMessage;
}

export function toInviteActionMessage(error: unknown): string {
  if (error instanceof InviteActionError) {
    return error.message;
  }

  if (isPostgrestError(error)) {
    return getInviteErrorMessage(error);
  }

  if (error instanceof TypeError) {
    return inviteNetworkErrorMessage;
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      includesAny(normalizedMessage, [
        "network",
        "fetch failed",
        "failed to fetch",
        "connection",
        "timeout",
      ])
    ) {
      return inviteNetworkErrorMessage;
    }
  }

  return defaultInviteErrorMessage;
}

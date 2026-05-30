import type { PostgrestError } from "@supabase/supabase-js";

export const defaultCoupleErrorMessage =
  "We couldn't complete this couple action right now. Please try again.";

const couplePermissionErrorMessage =
  "This couple update isn't available from your account right now.";
const coupleNetworkErrorMessage =
  "Connection looks unstable. Please check your internet and try again.";
const coupleInvariantErrorMessage =
  "We found an unexpected issue in your couple setup. Please try again.";

export class CoupleActionError extends Error {
  constructor(message: string = defaultCoupleErrorMessage) {
    super(message);
    this.name = "CoupleActionError";
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

export function getCoupleErrorMessage(error: PostgrestError | null): string {
  if (!error) {
    return defaultCoupleErrorMessage;
  }

  const searchableText = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "permission denied",
      "row-level security",
      "not authorized",
      "insufficient privileges",
      "forbidden",
    ])
  ) {
    return couplePermissionErrorMessage;
  }

  if (
    includesAny(searchableText, [
      "at most two active partners",
      "missing required members",
      "more than two active",
    ])
  ) {
    return coupleInvariantErrorMessage;
  }

  return defaultCoupleErrorMessage;
}

export function toCoupleActionMessage(error: unknown): string {
  if (error instanceof CoupleActionError) {
    return error.message;
  }

  if (isPostgrestError(error)) {
    return getCoupleErrorMessage(error);
  }

  if (error instanceof TypeError) {
    return coupleNetworkErrorMessage;
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      includesAny(normalizedMessage, [
        "network",
        "fetch",
        "connection",
        "timeout",
        "offline",
      ])
    ) {
      return coupleNetworkErrorMessage;
    }
  }

  return defaultCoupleErrorMessage;
}

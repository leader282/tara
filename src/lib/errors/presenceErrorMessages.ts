import type { PostgrestError } from "@supabase/supabase-js";

export const defaultPresenceErrorMessage =
  "We couldn't send that pulse right now. Please try again.";

const noActiveCoupleMessage =
  "Your couple space is not active yet. Set it up first, then send a pulse.";
const notPairedYetMessage =
  "Your space is ready, but pulses unlock after your partner joins.";
const invalidPulseTypeMessage =
  "That pulse option is not available right now. Please choose another.";
const messageTooLongErrorMessage = "Keep your note under 240 characters.";
const presenceNetworkErrorMessage =
  "Connection looks unstable. Please try again in a moment.";

export class PresenceActionError extends Error {
  constructor(message: string = defaultPresenceErrorMessage) {
    super(message);
    this.name = "PresenceActionError";
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

export function getPresenceErrorMessage(error: PostgrestError | null): string {
  if (!error) {
    return defaultPresenceErrorMessage;
  }

  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "active couple required",
      "no active couple",
      "expected exactly one active couple",
    ])
  ) {
    return noActiveCoupleMessage;
  }

  if (
    includesAny(searchableText, [
      "paired couple",
      "fewer than two active members",
      "waiting for your partner",
    ])
  ) {
    return notPairedYetMessage;
  }

  if (
    includesAny(searchableText, [
      "invalid presence pulse type",
      "presence_events_type_check",
    ])
  ) {
    return invalidPulseTypeMessage;
  }

  if (
    includesAny(searchableText, [
      "240 characters",
      "value too long",
      "string_data_right_truncation",
      "22001",
    ])
  ) {
    return messageTooLongErrorMessage;
  }

  if (
    includesAny(searchableText, [
      "permission denied",
      "row-level security",
      "forbidden",
      "not authorized",
    ])
  ) {
    return noActiveCoupleMessage;
  }

  return defaultPresenceErrorMessage;
}

export function toPresenceActionMessage(error: unknown): string {
  if (error instanceof PresenceActionError) {
    return error.message;
  }

  if (isPostgrestError(error)) {
    return getPresenceErrorMessage(error);
  }

  if (error instanceof TypeError) {
    return presenceNetworkErrorMessage;
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
      return presenceNetworkErrorMessage;
    }
  }

  return defaultPresenceErrorMessage;
}

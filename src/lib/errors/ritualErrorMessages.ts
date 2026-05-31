import type { PostgrestError } from "@supabase/supabase-js";

export type RitualErrorCode =
  | "no_active_couple"
  | "not_paired_yet"
  | "ritual_already_completed"
  | "text_response_missing"
  | "text_or_photo_required"
  | "photo_required"
  | "media_not_allowed"
  | "media_invalid"
  | "text_response_too_long"
  | "photo_not_supported_yet"
  | "network_error"
  | "unknown";

const ritualErrorMessages: Record<RitualErrorCode, string> = {
  no_active_couple: "Your couple space is not active yet. Pair first to start daily rituals.",
  not_paired_yet: "Today's ritual unlocks after both partners have joined the couple space.",
  ritual_already_completed: "Today's ritual is already complete.",
  text_response_missing: "Add a short response before completing this ritual.",
  text_or_photo_required: "Add a response or private photo before completing this ritual.",
  photo_required: "Add a private photo before completing this ritual.",
  media_not_allowed: "This ritual accepts text responses only.",
  media_invalid: "This photo can't be used for this ritual. Please upload a new one.",
  text_response_too_long: "Keep your response under 1000 characters.",
  photo_not_supported_yet: "This ritual type isn't available yet.",
  network_error: "Connection looks unstable right now. Please try again in a moment.",
  unknown: "We couldn't complete this ritual right now. Please try again.",
};

export class RitualActionError extends Error {
  code: RitualErrorCode;

  constructor(code: RitualErrorCode = "unknown", message?: string) {
    super(message ?? ritualErrorMessages[code]);
    this.name = "RitualActionError";
    this.code = code;
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

function getRitualErrorCodeFromPostgrest(error: PostgrestError): RitualErrorCode {
  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "active couple required",
      "expected exactly one active couple",
      "no active couple",
      "row-level security",
      "permission denied",
      "not authorized",
    ])
  ) {
    return "no_active_couple";
  }

  if (
    includesAny(searchableText, [
      "paired couple",
      "daily rituals require a paired couple",
      "fewer than two active members",
      "not paired",
    ])
  ) {
    return "not_paired_yet";
  }

  if (includesAny(searchableText, ["already complete", "already completed", "already revealed"])) {
    return "ritual_already_completed";
  }

  if (
    includesAny(searchableText, [
      "response text is required",
      "add a short response",
      "text response missing",
    ])
  ) {
    return "text_response_missing";
  }

  if (includesAny(searchableText, ["photo rituals require uploaded media"])) {
    return "photo_required";
  }

  if (includesAny(searchableText, ["ritual response requires text or uploaded media"])) {
    return "text_or_photo_required";
  }

  if (includesAny(searchableText, ["text rituals do not accept media"])) {
    return "media_not_allowed";
  }

  if (
    includesAny(searchableText, [
      "ritual media asset not found",
      "ritual media must be uploaded by you",
      "ritual media does not belong to this couple",
    ])
  ) {
    return "media_invalid";
  }

  if (
    includesAny(searchableText, [
      "1000 characters",
      "value too long",
      "string_data_right_truncation",
      "22001",
    ])
  ) {
    return "text_response_too_long";
  }

  if (
    includesAny(searchableText, [
      "photo rituals are not available",
      "ritual media upload is not available yet",
      "media upload is not available",
      "unsupported ritual input type",
    ])
  ) {
    return "photo_not_supported_yet";
  }

  return "unknown";
}

function getNetworkErrorCode(error: Error): RitualErrorCode {
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
    return "network_error";
  }

  return "unknown";
}

export function getRitualErrorMessage(code: RitualErrorCode): string {
  return ritualErrorMessages[code];
}

export function toRitualActionError(error: unknown): RitualActionError {
  if (error instanceof RitualActionError) {
    return error;
  }

  if (isPostgrestError(error)) {
    const code = getRitualErrorCodeFromPostgrest(error);
    return new RitualActionError(code);
  }

  if (error instanceof TypeError) {
    return new RitualActionError("network_error");
  }

  if (error instanceof Error) {
    const code = getNetworkErrorCode(error);
    return new RitualActionError(code);
  }

  return new RitualActionError("unknown");
}

export function toRitualActionMessage(error: unknown): string {
  return toRitualActionError(error).message;
}

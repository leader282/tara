import type { PostgrestError } from "@supabase/supabase-js";

export type TimelineErrorCode =
  | "no_active_couple"
  | "not_paired_yet"
  | "timeline_item_unavailable"
  | "permission_denied"
  | "network_error"
  | "unknown";

const timelineErrorMessages: Record<TimelineErrorCode, string> = {
  no_active_couple: "Your couple space is not active yet.",
  not_paired_yet: "Timeline moments appear after both partners have joined.",
  timeline_item_unavailable: "This timeline item is unavailable right now.",
  permission_denied: "You don't have access to this timeline.",
  network_error: "Connection looks unstable. Please try again in a moment.",
  unknown: "We couldn't load the timeline right now. Please try again.",
};

export class TimelineActionError extends Error {
  code: TimelineErrorCode;

  constructor(code: TimelineErrorCode = "unknown", message?: string) {
    super(message ?? timelineErrorMessages[code]);
    this.name = "TimelineActionError";
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

function getTimelineErrorCodeFromPostgrest(error: PostgrestError): TimelineErrorCode {
  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "active couple required",
      "no active couple",
      "expected exactly one active couple",
    ])
  ) {
    return "no_active_couple";
  }

  if (
    includesAny(searchableText, [
      "not paired",
      "paired couple",
      "waiting for your partner",
    ])
  ) {
    return "not_paired_yet";
  }

  if (
    includesAny(searchableText, [
      "not found",
      "timeline item not found",
      "p0002",
    ])
  ) {
    return "timeline_item_unavailable";
  }

  if (
    includesAny(searchableText, [
      "permission denied",
      "row-level security",
      "forbidden",
      "not authorized",
    ])
  ) {
    return "permission_denied";
  }

  return "unknown";
}

function getNetworkErrorCode(error: Error): TimelineErrorCode {
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

export function getTimelineErrorMessage(error: PostgrestError | null): string {
  if (!error) {
    return timelineErrorMessages.unknown;
  }

  const code = getTimelineErrorCodeFromPostgrest(error);
  return timelineErrorMessages[code];
}

export function toTimelineActionError(error: unknown): TimelineActionError {
  if (error instanceof TimelineActionError) {
    return error;
  }

  if (isPostgrestError(error)) {
    const code = getTimelineErrorCodeFromPostgrest(error);
    return new TimelineActionError(code);
  }

  if (error instanceof TypeError) {
    return new TimelineActionError("network_error");
  }

  if (error instanceof Error) {
    const code = getNetworkErrorCode(error);
    return new TimelineActionError(code);
  }

  return new TimelineActionError("unknown");
}

export function toTimelineActionMessage(error: unknown): string {
  return toTimelineActionError(error).message;
}

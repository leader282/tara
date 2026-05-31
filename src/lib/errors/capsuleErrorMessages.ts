import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export type CapsuleErrorCode =
  | "no_active_couple"
  | "not_paired_yet"
  | "title_missing"
  | "note_missing"
  | "note_too_long"
  | "media_invalid"
  | "unlock_date_in_past"
  | "capsule_locked"
  | "capsule_not_found"
  | "permission_denied"
  | "network_error"
  | "unknown";

const capsuleErrorMessages: Record<CapsuleErrorCode, string> = {
  no_active_couple: "Your couple space is not active yet.",
  not_paired_yet: "Memory capsules unlock after both partners have joined.",
  title_missing: "Add a short title for this memory capsule.",
  note_missing: "Add a note or private photo before saving this memory capsule.",
  note_too_long: "Keep your note under 5000 characters.",
  media_invalid: "This photo can't be used for this capsule. Please upload it again.",
  unlock_date_in_past: "Choose an unlock date and time in the future.",
  capsule_locked: "This memory capsule is still locked.",
  capsule_not_found: "We couldn't find that memory capsule.",
  permission_denied: "You don't have access to that memory capsule.",
  network_error: "Connection looks unstable. Please try again in a moment.",
  unknown: "We couldn't complete that memory capsule action right now.",
};

export class CapsuleActionError extends Error {
  code: CapsuleErrorCode;

  constructor(code: CapsuleErrorCode = "unknown", message?: string) {
    super(message ?? capsuleErrorMessages[code]);
    this.name = "CapsuleActionError";
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

function getCapsuleErrorCodeFromPostgrest(error: PostgrestError): CapsuleErrorCode {
  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "active couple required",
      "expected exactly one active couple",
      "no active couple",
    ])
  ) {
    return "no_active_couple";
  }

  if (
    includesAny(searchableText, [
      "paired couple",
      "fewer than two active members",
      "require a paired couple",
      "not paired",
    ])
  ) {
    return "not_paired_yet";
  }

  if (includesAny(searchableText, ["memory capsule not found", "p0002", "not found"])) {
    return "capsule_not_found";
  }

  if (
    includesAny(searchableText, [
      "memory capsule is not unlocked yet",
      "still locked",
    ])
  ) {
    return "capsule_locked";
  }

  if (
    includesAny(searchableText, [
      "unlock date must be in the future",
      "unlock date is too far in the future",
      "unlock date is required",
    ])
  ) {
    return "unlock_date_in_past";
  }

  if (includesAny(searchableText, ["title", "title must"])) {
    return "title_missing";
  }

  if (
    includesAny(searchableText, [
      "note must be between 1 and 5000",
      "note is required",
      "add your note",
      "requires a note or uploaded media",
    ])
  ) {
    return "note_missing";
  }

  if (
    includesAny(searchableText, [
      "memory capsule media asset not found",
      "memory capsule media must be uploaded by you",
      "memory capsule media does not belong to this couple",
    ])
  ) {
    return "media_invalid";
  }

  if (
    includesAny(searchableText, [
      "5000 characters",
      "value too long",
      "string_data_right_truncation",
      "22001",
    ])
  ) {
    return "note_too_long";
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

function getCapsuleErrorCodeFromZod(error: ZodError): CapsuleErrorCode {
  const issue = error.issues[0];
  if (!issue) {
    return "unknown";
  }

  const path = String(issue.path[0] ?? "").toLowerCase();
  const message = issue.message.toLowerCase();

  if (path === "title") {
    return "title_missing";
  }

  if (path === "note") {
    if (message.includes("5000")) {
      return "note_too_long";
    }

    return "note_missing";
  }

  if (path === "mediaassetid") {
    return "media_invalid";
  }

  if (path === "unlockdate" || path === "unlocktime") {
    return "unlock_date_in_past";
  }

  if (path === "capsuleid") {
    return "capsule_not_found";
  }

  return "unknown";
}

function getNetworkErrorCode(error: Error): CapsuleErrorCode {
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

export function getCapsuleErrorMessage(code: CapsuleErrorCode): string {
  return capsuleErrorMessages[code];
}

export function toCapsuleActionError(error: unknown): CapsuleActionError {
  if (error instanceof CapsuleActionError) {
    return error;
  }

  if (error instanceof ZodError) {
    const code = getCapsuleErrorCodeFromZod(error);
    return new CapsuleActionError(code);
  }

  if (isPostgrestError(error)) {
    const code = getCapsuleErrorCodeFromPostgrest(error);
    return new CapsuleActionError(code);
  }

  if (error instanceof TypeError) {
    return new CapsuleActionError("network_error");
  }

  if (error instanceof Error) {
    const code = getNetworkErrorCode(error);
    return new CapsuleActionError(code);
  }

  return new CapsuleActionError("unknown");
}

export function toCapsuleActionMessage(error: unknown): string {
  return toCapsuleActionError(error).message;
}

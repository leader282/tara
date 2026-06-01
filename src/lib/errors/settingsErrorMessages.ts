import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export type SettingsErrorCode =
  | "no_active_couple"
  | "not_paired"
  | "permission_denied"
  | "network_error"
  | "invalid_payload"
  | "unknown";

const settingsErrorMessages: Record<SettingsErrorCode, string> = {
  no_active_couple: "You don't have an active couple space to update right now.",
  not_paired: "This setting is available once your couple space is fully paired.",
  permission_denied: "This settings update isn't available from your account right now.",
  network_error: "Connection looks unstable. Please try again in a moment.",
  invalid_payload: "Some settings values were invalid. Please review and try again.",
  unknown: "We couldn't save these settings right now. Please try again.",
};

export class SettingsActionError extends Error {
  code: SettingsErrorCode;

  constructor(code: SettingsErrorCode = "unknown", message?: string) {
    super(message ?? settingsErrorMessages[code]);
    this.name = "SettingsActionError";
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

function getSettingsErrorCodeFromPostgrest(error: PostgrestError): SettingsErrorCode {
  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (includesAny(searchableText, ["no active couple", "no paired active couple", "not paired"])) {
    return includesAny(searchableText, ["paired"]) ? "not_paired" : "no_active_couple";
  }

  if (
    includesAny(searchableText, [
      "permission denied",
      "row-level security",
      "not authorized",
      "forbidden",
      "insufficient privilege",
    ])
  ) {
    return "permission_denied";
  }

  if (
    includesAny(searchableText, [
      "invalid",
      "must be",
      "timezone",
      "ritual_frequency",
      "quiet hour",
      "date",
      "uuid",
    ])
  ) {
    return "invalid_payload";
  }

  if (
    includesAny(searchableText, [
      "network",
      "connection",
      "timeout",
      "fetch",
      "temporarily unavailable",
    ])
  ) {
    return "network_error";
  }

  return "unknown";
}

function getSettingsErrorCodeFromMessage(error: Error): SettingsErrorCode {
  const searchableText = error.message.toLowerCase();

  if (
    includesAny(searchableText, [
      "network",
      "fetch",
      "connection",
      "timeout",
      "offline",
    ])
  ) {
    return "network_error";
  }

  if (includesAny(searchableText, ["no paired active couple", "not paired"])) {
    return "not_paired";
  }

  if (includesAny(searchableText, ["no active couple"])) {
    return "no_active_couple";
  }

  if (
    includesAny(searchableText, [
      "timezone",
      "display name",
      "birthday",
      "quiet",
      "invalid",
    ])
  ) {
    return "invalid_payload";
  }

  return "unknown";
}

export function getSettingsErrorMessage(code: SettingsErrorCode): string {
  return settingsErrorMessages[code];
}

export function toSettingsActionError(error: unknown): SettingsActionError {
  if (error instanceof SettingsActionError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new SettingsActionError("invalid_payload");
  }

  if (isPostgrestError(error)) {
    return new SettingsActionError(getSettingsErrorCodeFromPostgrest(error));
  }

  if (error instanceof TypeError) {
    return new SettingsActionError("network_error");
  }

  if (error instanceof Error) {
    return new SettingsActionError(getSettingsErrorCodeFromMessage(error));
  }

  return new SettingsActionError("unknown");
}

export function toSettingsActionMessage(error: unknown): string {
  return toSettingsActionError(error).message;
}

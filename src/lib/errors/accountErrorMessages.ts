import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export type AccountErrorCode =
  | "invalid_confirmation"
  | "no_active_couple"
  | "not_paired"
  | "request_already_pending"
  | "request_not_found"
  | "request_cannot_be_canceled"
  | "permission_denied"
  | "network_error"
  | "unknown";

const accountErrorMessages: Record<AccountErrorCode, string> = {
  invalid_confirmation: "Please type the exact confirmation to continue.",
  no_active_couple: "You don't have an active couple space to leave right now.",
  not_paired: "This action is available once your couple space is fully paired.",
  request_already_pending: "A request is already in progress. You can check its status below.",
  request_not_found: "We couldn't find that request anymore. Please refresh and try again.",
  request_cannot_be_canceled: "This request can no longer be canceled.",
  permission_denied: "This account action isn't available from your account right now.",
  network_error: "Connection looks unstable. Please try again in a moment.",
  unknown: "We couldn't complete this account action right now. Please try again.",
};

export class AccountActionError extends Error {
  code: AccountErrorCode;

  constructor(code: AccountErrorCode = "unknown", message?: string) {
    super(message ?? accountErrorMessages[code]);
    this.name = "AccountActionError";
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

function getAccountErrorCodeFromPostgrest(error: PostgrestError): AccountErrorCode {
  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "confirmation must be",
      "confirmation must",
      "invalid confirmation",
      "must be unpair",
      "must be delete",
    ])
  ) {
    return "invalid_confirmation";
  }

  if (includesAny(searchableText, ["no paired active couple", "not paired"])) {
    return "not_paired";
  }

  if (includesAny(searchableText, ["no active couple found"])) {
    return "no_active_couple";
  }

  if (
    includesAny(searchableText, [
      "already pending",
      "already exists",
      "request already exists",
      "status in ('pending', 'processing')",
      "processing request",
    ])
  ) {
    return "request_already_pending";
  }

  if (includesAny(searchableText, ["request not found", "not found"])) {
    return "request_not_found";
  }

  if (
    includesAny(searchableText, [
      "only pending",
      "can be canceled",
      "cannot be canceled",
      "cannot be cancelled",
    ])
  ) {
    return "request_cannot_be_canceled";
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

function getAccountErrorCodeFromMessage(error: Error): AccountErrorCode {
  const searchableText = error.message.toLowerCase();

  if (
    includesAny(searchableText, [
      "confirmation",
      "must be unpair",
      "must be delete",
      "invalid confirmation",
    ])
  ) {
    return "invalid_confirmation";
  }

  if (includesAny(searchableText, ["no paired active couple", "not paired"])) {
    return "not_paired";
  }

  if (includesAny(searchableText, ["no active couple"])) {
    return "no_active_couple";
  }

  if (includesAny(searchableText, ["already pending", "already exists"])) {
    return "request_already_pending";
  }

  if (includesAny(searchableText, ["request not found"])) {
    return "request_not_found";
  }

  if (includesAny(searchableText, ["can no longer be canceled", "only pending"])) {
    return "request_cannot_be_canceled";
  }

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

  return "unknown";
}

function getAccountErrorCodeFromZod(error: ZodError): AccountErrorCode {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return "unknown";
  }

  const path = String(firstIssue.path[0] ?? "").toLowerCase();
  if (path.includes("confirmation")) {
    return "invalid_confirmation";
  }

  return "unknown";
}

export function getAccountErrorMessage(code: AccountErrorCode): string {
  return accountErrorMessages[code];
}

export function toAccountActionError(error: unknown): AccountActionError {
  if (error instanceof AccountActionError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AccountActionError(getAccountErrorCodeFromZod(error));
  }

  if (isPostgrestError(error)) {
    return new AccountActionError(getAccountErrorCodeFromPostgrest(error));
  }

  if (error instanceof TypeError) {
    return new AccountActionError("network_error");
  }

  if (error instanceof Error) {
    return new AccountActionError(getAccountErrorCodeFromMessage(error));
  }

  return new AccountActionError("unknown");
}

export function toAccountActionMessage(error: unknown): string {
  return toAccountActionError(error).message;
}

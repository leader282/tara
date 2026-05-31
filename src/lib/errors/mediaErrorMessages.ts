import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export type MediaErrorCode =
  | "permission_denied"
  | "picker_canceled"
  | "unsupported_file_type"
  | "image_too_large"
  | "processing_failed"
  | "upload_failed"
  | "storage_policy_denied"
  | "network_error"
  | "unknown";

const mediaErrorMessages: Record<MediaErrorCode, string> = {
  permission_denied: "Media access is blocked. Please check permissions and try again.",
  picker_canceled: "Image selection was canceled.",
  unsupported_file_type: "Please choose a JPEG, PNG, or WebP image.",
  image_too_large: "That image is too large. Please choose one under 5 MB after processing.",
  processing_failed: "We couldn't prepare that image for upload.",
  upload_failed: "We couldn't upload that image right now. Please try again.",
  storage_policy_denied: "Upload permission was denied by storage privacy rules.",
  network_error: "Connection looks unstable. Please try uploading again.",
  unknown: "Something went wrong while handling media.",
};

export class MediaActionError extends Error {
  code: MediaErrorCode;

  constructor(code: MediaErrorCode = "unknown", message?: string) {
    super(message ?? mediaErrorMessages[code]);
    this.name = "MediaActionError";
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

function getErrorCodeFromPostgrest(error: PostgrestError): MediaErrorCode {
  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "violates row-level security policy",
      "storage.objects",
      "new row violates row-level security policy",
      "permission denied for table objects",
    ])
  ) {
    return "storage_policy_denied";
  }

  if (
    includesAny(searchableText, [
      "permission denied",
      "not authorized",
      "forbidden",
      "row-level security",
    ])
  ) {
    return "permission_denied";
  }

  if (
    includesAny(searchableText, [
      "mime type",
      "unsupported file type",
      "invalid mime type",
      "allowed mime types",
    ])
  ) {
    return "unsupported_file_type";
  }

  if (
    includesAny(searchableText, [
      "file size",
      "too large",
      "max upload size",
      "5 mb",
      "size must",
    ])
  ) {
    return "image_too_large";
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

  return "upload_failed";
}

function getErrorCodeFromZod(error: ZodError): MediaErrorCode {
  const issue = error.issues[0];
  if (!issue) {
    return "unknown";
  }

  const path = String(issue.path[0] ?? "").toLowerCase();

  if (path === "mimetype") {
    return "unsupported_file_type";
  }

  if (path === "sizebytes") {
    return "image_too_large";
  }

  if (path === "width" || path === "height" || path === "localuri") {
    return "processing_failed";
  }

  return "unknown";
}

function getErrorCodeFromMessage(error: Error): MediaErrorCode {
  const normalizedMessage = error.message.toLowerCase();

  if (
    includesAny(normalizedMessage, [
      "cancel",
      "user canceled image picker",
      "selection canceled",
    ])
  ) {
    return "picker_canceled";
  }

  if (
    includesAny(normalizedMessage, [
      "permission",
      "access denied",
      "not granted",
    ])
  ) {
    return "permission_denied";
  }

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

  if (
    includesAny(normalizedMessage, [
      "unsupported",
      "mime",
      "file type",
      "format",
    ])
  ) {
    return "unsupported_file_type";
  }

  if (includesAny(normalizedMessage, ["too large", "5 mb", "size"])) {
    return "image_too_large";
  }

  if (includesAny(normalizedMessage, ["process", "manipulat"])) {
    return "processing_failed";
  }

  if (includesAny(normalizedMessage, ["upload"])) {
    return "upload_failed";
  }

  return "unknown";
}

export function getMediaErrorMessage(code: MediaErrorCode): string {
  return mediaErrorMessages[code];
}

export function toMediaActionError(error: unknown): MediaActionError {
  if (error instanceof MediaActionError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new MediaActionError(getErrorCodeFromZod(error));
  }

  if (isPostgrestError(error)) {
    return new MediaActionError(getErrorCodeFromPostgrest(error));
  }

  if (error instanceof TypeError) {
    return new MediaActionError("network_error");
  }

  if (error instanceof Error) {
    return new MediaActionError(getErrorCodeFromMessage(error));
  }

  return new MediaActionError("unknown");
}

export function toMediaActionMessage(error: unknown): string {
  return toMediaActionError(error).message;
}

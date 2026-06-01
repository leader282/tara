import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export type NotificationErrorCode =
  | "permission_unavailable"
  | "permission_denied"
  | "permission_blocked"
  | "physical_device_required"
  | "project_id_missing"
  | "token_unavailable"
  | "registration_failed"
  | "unregistration_failed"
  | "preferences_failed"
  | "network_error"
  | "invalid_payload"
  | "unknown";

const notificationErrorMessages: Record<NotificationErrorCode, string> = {
  permission_unavailable:
    "Notifications are unavailable on this device right now.",
  permission_denied:
    "Notifications are off. Enable them in system settings when you're ready.",
  permission_blocked:
    "Notifications are blocked in system settings for this app.",
  physical_device_required:
    "Push notifications require a physical device.",
  project_id_missing:
    "Push notifications are not configured yet. Missing Expo project id.",
  token_unavailable:
    "We couldn't get a push token for this device yet. Please try again.",
  registration_failed:
    "We couldn't register this device for notifications right now.",
  unregistration_failed:
    "We couldn't disable notifications for this device right now.",
  preferences_failed:
    "We couldn't update your notification preferences right now.",
  network_error:
    "Connection looks unstable. Please try again in a moment.",
  invalid_payload:
    "Notification data was invalid.",
  unknown:
    "Something went wrong while handling notifications.",
};

export class NotificationActionError extends Error {
  code: NotificationErrorCode;

  constructor(code: NotificationErrorCode = "unknown", message?: string) {
    super(message ?? notificationErrorMessages[code]);
    this.name = "NotificationActionError";
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

function getNotificationErrorCodeFromPostgrest(error: PostgrestError): NotificationErrorCode {
  const searchableText =
    `${error.code ?? ""} ${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  if (
    includesAny(searchableText, [
      "register_push_token",
      "push token",
      "invalid push token",
      "token type",
      "platform",
    ])
  ) {
    return "registration_failed";
  }

  if (includesAny(searchableText, ["unregister_push_token", "revoked"])) {
    return "unregistration_failed";
  }

  if (includesAny(searchableText, ["notification_preferences", "preferences"])) {
    return "preferences_failed";
  }

  if (
    includesAny(searchableText, [
      "permission denied",
      "row-level security",
      "not authorized",
      "forbidden",
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

function getNotificationErrorCodeFromZod(error: ZodError): NotificationErrorCode {
  const issue = error.issues[0];
  if (!issue) {
    return "invalid_payload";
  }

  const path = String(issue.path[0] ?? "").toLowerCase();

  if (path.includes("token")) {
    return "token_unavailable";
  }

  if (path.includes("permission")) {
    return "permission_denied";
  }

  if (path.includes("projectid")) {
    return "project_id_missing";
  }

  return "invalid_payload";
}

function getNotificationErrorCodeFromMessage(error: Error): NotificationErrorCode {
  const normalizedMessage = error.message.toLowerCase();

  if (
    includesAny(normalizedMessage, [
      "physical device",
      "must use physical device",
      "simulator",
    ])
  ) {
    return "physical_device_required";
  }

  if (
    includesAny(normalizedMessage, [
      "project id",
      "eas project",
      "projectid",
    ])
  ) {
    return "project_id_missing";
  }

  if (
    includesAny(normalizedMessage, [
      "permission unavailable",
      "notifications are unavailable",
      "not available on web",
    ])
  ) {
    return "permission_unavailable";
  }

  if (
    includesAny(normalizedMessage, [
      "permission blocked",
      "can't ask again",
      "cannot ask again",
    ])
  ) {
    return "permission_blocked";
  }

  if (
    includesAny(normalizedMessage, [
      "permission denied",
      "not granted",
      "denied",
    ])
  ) {
    return "permission_denied";
  }

  if (
    includesAny(normalizedMessage, [
      "token",
      "expo push",
    ])
  ) {
    return "token_unavailable";
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

  return "unknown";
}

export function getNotificationErrorMessage(code: NotificationErrorCode): string {
  return notificationErrorMessages[code];
}

export function toNotificationActionError(error: unknown): NotificationActionError {
  if (error instanceof NotificationActionError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new NotificationActionError(getNotificationErrorCodeFromZod(error));
  }

  if (isPostgrestError(error)) {
    return new NotificationActionError(getNotificationErrorCodeFromPostgrest(error));
  }

  if (error instanceof TypeError) {
    return new NotificationActionError("network_error");
  }

  if (error instanceof Error) {
    return new NotificationActionError(getNotificationErrorCodeFromMessage(error));
  }

  return new NotificationActionError("unknown");
}

export function toNotificationActionMessage(error: unknown): string {
  return toNotificationActionError(error).message;
}

const REDACTED = "[REDACTED]";
const CIRCULAR_REFERENCE = "[Circular]";
const TRUNCATED = "[Truncated]";
const MAX_DEPTH = 6;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_REGEX = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

const SENSITIVE_NORMALIZED_KEYS = new Set([
  "accesstoken",
  "apikey",
  "authorization",
  "capsulenote",
  "capsulenotes",
  "email",
  "emailaddress",
  "expopushtoken",
  "invitecode",
  "mediapath",
  "notificationtoken",
  "note",
  "notes",
  "optionalmessage",
  "password",
  "pushtoken",
  "refreshtoken",
  "responsetext",
  "secret",
  "servicerole",
  "servicerolekey",
  "signedurl",
  "storagepath",
  "textresponse",
  "token",
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  if (SENSITIVE_NORMALIZED_KEYS.has(normalized)) {
    return true;
  }

  if (normalized.endsWith("token") || normalized.endsWith("apikey")) {
    return true;
  }

  if (normalized.includes("invitecode") || normalized.includes("servicerole")) {
    return true;
  }

  if (normalized.includes("signed") && normalized.includes("url")) {
    return true;
  }

  if (normalized.includes("storage") && normalized.includes("path")) {
    return true;
  }

  if (normalized.includes("media") && normalized.includes("path")) {
    return true;
  }

  return false;
}

function sanitizeString(value: string): string {
  const lowerValue = value.toLowerCase();
  const trimmedValue = value.trim();

  if (EMAIL_REGEX.test(trimmedValue)) {
    return REDACTED;
  }

  if (JWT_REGEX.test(trimmedValue) || lowerValue.includes("bearer ")) {
    return REDACTED;
  }

  if (
    lowerValue.includes("token=") ||
    lowerValue.includes("signature=") ||
    lowerValue.includes("sig=") ||
    lowerValue.includes("x-amz-signature") ||
    lowerValue.includes("x-amz-credential")
  ) {
    return REDACTED;
  }

  if (
    lowerValue.includes("/storage/v1/object/sign/") ||
    lowerValue.includes("/storage/v1/object/") ||
    lowerValue.includes("service_role")
  ) {
    return REDACTED;
  }

  return value;
}

function sanitizeUnknown(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > MAX_DEPTH) {
    return TRUNCATED;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "function") {
    return `[Function ${(value as (...args: unknown[]) => unknown).name || "anonymous"}]`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      message: sanitizeString(value.message),
      name: value.name,
      stack: value.stack ? sanitizeString(value.stack) : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item, depth + 1, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE;
    }

    seen.add(value);
    const sanitizedObject: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      sanitizedObject[key] = isSensitiveKey(key)
        ? REDACTED
        : sanitizeUnknown(nestedValue, depth + 1, seen);
    }
    seen.delete(value);

    return sanitizedObject;
  }

  return String(value);
}

export function sanitizeLogPayload<T>(payload: T): T {
  return sanitizeUnknown(payload, 0, new WeakSet<object>()) as T;
}

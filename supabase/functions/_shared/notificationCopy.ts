const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 240;
const MAX_DATA_DEPTH = 4;
const MAX_DATA_KEYS_PER_OBJECT = 40;

const SENSITIVE_KEY_PATTERN =
  /(note|response|media|image|photo|location|lat|lng|message|optional|read|seen|receipt|url)/i;

const FALLBACK_COPY_BY_TYPE: Record<string, { title: string; body: string }> = {
  presence_pulse: {
    title: "A gentle pulse from your partner",
    body: "Open Tara whenever you feel ready to reconnect.",
  },
  ritual_ready: {
    title: "Your ritual is ready",
    body: "Open Tara whenever you want to see your shared ritual.",
  },
  ritual_reminder: {
    title: "A gentle ritual reminder",
    body: "Today's ritual is ready whenever you have a quiet moment.",
  },
  capsule_unlocked: {
    title: "A memory capsule is ready",
    body: "A memory capsule can now be opened in Tara.",
  },
  countdown_reminder: {
    title: "A reunion moment is coming up",
    body: "Take a quiet moment with Tara whenever it feels right.",
  },
  system_test: {
    title: "Notification test",
    body: "This is a Tara notification test.",
  },
};

function fallbackCopyForType(notificationType: string): { title: string; body: string } {
  return FALLBACK_COPY_BY_TYPE[notificationType] ?? {
    title: "A Tara update is waiting",
    body: "Open Tara whenever you feel ready.",
  };
}

function sanitizeText(
  value: string | null | undefined,
  fallback: string,
  maxLength: number,
): string {
  const candidate = value?.trim().replace(/\s+/g, " ");
  if (!candidate) {
    return fallback;
  }

  return candidate.slice(0, maxLength);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeJsonValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DATA_DEPTH) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case "string":
      return value.slice(0, 500);
    case "number":
    case "boolean":
      return value;
    case "object":
      if (Array.isArray(value)) {
        const result: unknown[] = [];
        for (const item of value) {
          const sanitized = sanitizeJsonValue(item, depth + 1);
          if (sanitized !== undefined) {
            result.push(sanitized);
          }
        }
        return result;
      }

      if (isPlainObject(value)) {
        const result: Record<string, unknown> = {};
        let keyCount = 0;

        for (const [key, nestedValue] of Object.entries(value)) {
          if (keyCount >= MAX_DATA_KEYS_PER_OBJECT) {
            break;
          }

          if (SENSITIVE_KEY_PATTERN.test(key)) {
            continue;
          }

          const sanitized = sanitizeJsonValue(nestedValue, depth + 1);
          if (sanitized !== undefined) {
            result[key] = sanitized;
            keyCount += 1;
          }
        }

        return result;
      }

      return undefined;
    default:
      return undefined;
  }
}

export function getSafeNotificationCopy(
  notificationType: string,
  title: string | null | undefined,
  body: string | null | undefined,
): { title: string; body: string } {
  const fallback = fallbackCopyForType(notificationType);

  return {
    title: sanitizeText(title, fallback.title, MAX_TITLE_LENGTH),
    body: sanitizeText(body, fallback.body, MAX_BODY_LENGTH),
  };
}

export function sanitizeNotificationData(data: unknown): Record<string, unknown> {
  if (!isPlainObject(data)) {
    return {};
  }

  const sanitized = sanitizeJsonValue(data, 0);
  if (!isPlainObject(sanitized)) {
    return {};
  }

  return sanitized;
}

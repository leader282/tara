const MAX_DATA_DEPTH = 4;
const MAX_DATA_KEYS_PER_OBJECT = 40;
const MAX_TITLE_LENGTH = 80;
const MAX_BODY_LENGTH = 180;

const SENSITIVE_KEY_PATTERN =
  /(note|response|media|image|photo|location|lat|lng|message|optional|read|seen|receipt|url)/i;

const FALLBACK_COPY_BY_TYPE: Record<string, { title: string; body: string }> = {
  presence_pulse: {
    title: "💌 Your partner sent you a pulse",
    body: "A little moment of closeness is waiting in Tara.",
  },
  ritual_ready: {
    title: "✨ Your answers are revealed",
    body: "See what you both shared in today's ritual.",
  },
  ritual_reminder: {
    title: "📝 Today's ritual is waiting",
    body: "A small prompt for you two. Answer whenever you have a quiet moment.",
  },
  capsule_unlocked: {
    title: "🎁 A memory capsule is ready",
    body: "It can be opened now. Share the moment together in Tara.",
  },
  countdown_reminder: {
    title: "✈️ Your reunion is getting closer",
    body: "Take a quiet moment with Tara whenever it feels right.",
  },
  system_test: {
    title: "🔔 Notification test",
    body: "This is a Tara notification test.",
  },
};

const PARTNER_INITIATED_TYPES = new Set(["presence_pulse", "ritual_ready", "capsule_unlocked"]);

function fallbackCopyForType(notificationType: string): { title: string; body: string } {
  return FALLBACK_COPY_BY_TYPE[notificationType] ?? {
    title: "A Tara update is waiting",
    body: "Open Tara whenever you feel ready.",
  };
}

function isControlCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f);
}

function cleanCopy(value: string | null | undefined, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = Array.from(value)
    .map((character) => (isControlCharacter(character) ? " " : character))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length === 0) {
    return null;
  }

  const characters = Array.from(normalized);
  if (characters.length <= maxLength) {
    return normalized;
  }

  return `${characters.slice(0, maxLength - 1).join("").trimEnd()}…`;
}

export function shouldPlaySound(notificationType: string): boolean {
  return PARTNER_INITIATED_TYPES.has(notificationType);
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

/**
 * Queue rows are written only by security-definer database functions, whose contract keeps
 * notes, ritual responses, capsule content, media, and locations out of title and body.
 */
export function getSafeNotificationCopy(
  notificationType: string,
  title: string | null | undefined,
  body: string | null | undefined,
): { title: string; body: string } {
  const safeTitle = cleanCopy(title, MAX_TITLE_LENGTH);
  const safeBody = cleanCopy(body, MAX_BODY_LENGTH);

  if (!safeTitle || !safeBody) {
    return fallbackCopyForType(notificationType);
  }

  return { title: safeTitle, body: safeBody };
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

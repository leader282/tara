import { sanitizeLogPayload } from "@/lib/logging/sanitizeLogPayload";

declare const __DEV__: boolean;

type LogContext = Record<string, unknown> | undefined;
type MonitoringSeverityLevel = "fatal" | "error" | "warning" | "log" | "info" | "debug";

const LOG_PREFIX = "[tara]";

function toSafeContext(context?: LogContext): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  const safeContext = sanitizeLogPayload(context);
  if (!safeContext || typeof safeContext !== "object") {
    return undefined;
  }

  return safeContext as Record<string, unknown>;
}

function toSafeMessage(message: string): string {
  const safeMessage = sanitizeLogPayload(message);
  return typeof safeMessage === "string" ? safeMessage : "Sanitized log message";
}

function printLog(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  context?: LogContext,
  error?: unknown
): void {
  const safeMessage = toSafeMessage(message);
  const safeContext = toSafeContext(context);
  const safeError = error === undefined ? undefined : sanitizeLogPayload(error);
  const formattedMessage = `${LOG_PREFIX} ${safeMessage}`;

  if (level === "debug") {
    console.debug(formattedMessage, safeContext);
    return;
  }

  if (level === "info") {
    console.info(formattedMessage, safeContext);
    return;
  }

  if (level === "warn") {
    console.warn(formattedMessage, safeContext);
    return;
  }

  console.error(formattedMessage, safeError, safeContext);
}

function captureLogMessage(
  message: string,
  level: MonitoringSeverityLevel,
  context?: LogContext,
  error?: unknown
): void {
  const safeContext = toSafeContext(context);
  void import("@/lib/monitoring/sentry")
    .then(({ captureException, captureMessage }) => {
      if (error instanceof Error) {
        captureException(error, {
          logger_message: toSafeMessage(message),
          ...safeContext,
        });
        return;
      }

      captureMessage(toSafeMessage(message), level, {
        ...safeContext,
        ...(error !== undefined ? { error: sanitizeLogPayload(error) } : {}),
      });
    })
    .catch(() => {
      // Logging should never throw into app code or tests.
    });
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!__DEV__) {
      return;
    }

    printLog("debug", message, context);
  },

  info(message: string, context?: LogContext): void {
    if (!__DEV__) {
      return;
    }

    printLog("info", message, context);
  },

  warn(message: string, context?: LogContext): void {
    printLog("warn", message, context);
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    printLog("error", message, context, error);
    captureLogMessage(message, "error", context, error);
  },
};

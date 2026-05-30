import type { AppErrorCode } from "@/lib/errors/AppError";

const defaultErrorMessage =
  "Something went wrong. Please try again in a moment.";

const messageByCode: Record<AppErrorCode, string> = {
  ENV_INVALID:
    "App configuration is missing. Please set the required environment values.",
  NETWORK: "Connection looks unstable. Please check your internet and try again.",
  STORAGE: "We could not access local storage right now. Please try again.",
  UNKNOWN: defaultErrorMessage,
};

export function getErrorMessage(code: AppErrorCode): string {
  return messageByCode[code] ?? defaultErrorMessage;
}

export { defaultErrorMessage };

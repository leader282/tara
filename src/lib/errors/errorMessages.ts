import type { AppErrorCode } from "@/lib/errors/AppError";

const defaultErrorMessage =
  "Something went wrong. Please try again in a moment.";

const messageByCode: Record<AppErrorCode, string> = {
  ENV_INVALID: "Tara isn't set up correctly on this phone. Please reinstall the app.",
  NETWORK: "Connection looks unstable. Please check your internet and try again.",
  STORAGE: "We couldn't save that on your phone right now. Please try again.",
  UNKNOWN: defaultErrorMessage,
};

export function getErrorMessage(code: AppErrorCode): string {
  return messageByCode[code] ?? defaultErrorMessage;
}

export { defaultErrorMessage };

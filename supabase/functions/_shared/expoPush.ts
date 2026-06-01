import { getSafeNotificationCopy, sanitizeNotificationData } from "./notificationCopy.ts";

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

export const EXPO_MAX_MESSAGES_PER_REQUEST = 100;
const EXPO_MAX_RECEIPT_IDS_PER_REQUEST = 300;

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

type JsonObject = { [key: string]: Json };

const RETRYABLE_EXPO_ERROR_CODES = new Set([
  "MessageRateExceeded",
  "ExpoServerError",
  "InternalServerError",
  "ServiceUnavailable",
  "PushTooManyRequests",
  "TooManyRequests",
]);

const NON_RETRYABLE_EXPO_ERROR_CODES = new Set([
  "DeviceNotRegistered",
  "InvalidCredentials",
  "MessageTooBig",
  "MessageRateExceededForDevice",
  "MismatchSenderId",
  "InvalidPushToken",
]);

function chunkValues<T>(values: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toJsonValue(value: unknown, depth = 0): Json | undefined {
  if (depth > 6) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case "string":
      return value.slice(0, 2000);
    case "number":
    case "boolean":
      return value;
    case "object":
      if (Array.isArray(value)) {
        const result: Json[] = [];
        for (const item of value) {
          const parsedItem = toJsonValue(item, depth + 1);
          if (parsedItem !== undefined) {
            result.push(parsedItem);
          }
        }
        return result;
      }

      if (isPlainObject(value)) {
        const result: JsonObject = {};
        for (const [key, nested] of Object.entries(value)) {
          const parsedNested = toJsonValue(nested, depth + 1);
          if (parsedNested !== undefined) {
            result[key] = parsedNested;
          }
        }
        return result;
      }

      return undefined;
    default:
      return undefined;
  }
}

function toJsonObject(value: unknown): JsonObject | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const parsed = toJsonValue(value, 0);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return null;
  }

  return parsed;
}

function buildExpoHeaders(expoAccessToken?: string): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  if (expoAccessToken) {
    headers.set("Authorization", `Bearer ${expoAccessToken}`);
  }

  return headers;
}

function errorCodeFromDetails(details: JsonObject | null): string | null {
  if (!details) {
    return null;
  }

  const code = details.error;
  return typeof code === "string" ? code : null;
}

export function isExpoPushToken(token: string): boolean {
  const trimmed = token.trim();
  return trimmed.startsWith("ExponentPushToken[") || trimmed.startsWith("ExpoPushToken[");
}

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound?: "default";
}

export interface BuildExpoMessageInput {
  to: string;
  notificationType: string;
  title: string;
  body: string;
  data: unknown;
  sound?: "default";
}

export interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: JsonObject | null;
}

export interface ExpoSendResultItem {
  message: ExpoPushMessage;
  ticket: ExpoPushTicket;
  retryable: boolean;
}

export interface ExpoSendResult {
  items: ExpoSendResultItem[];
  requestErrors: string[];
}

export interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: JsonObject | null;
}

export interface ExpoReceiptLookupResult {
  receiptsByTicketId: Record<string, ExpoPushReceipt>;
  requestErrors: string[];
  missingTicketIds: string[];
}

export function buildSafeExpoMessage(input: BuildExpoMessageInput): ExpoPushMessage | null {
  if (!isExpoPushToken(input.to)) {
    return null;
  }

  const copy = getSafeNotificationCopy(input.notificationType, input.title, input.body);
  const message: ExpoPushMessage = {
    to: input.to.trim(),
    title: copy.title,
    body: copy.body,
    data: sanitizeNotificationData(input.data),
  };

  if (input.sound === "default") {
    message.sound = "default";
  }

  return message;
}

export function isRetryableExpoError(
  details: JsonObject | null,
  message: string | null | undefined,
  httpStatus?: number,
): boolean {
  if (typeof httpStatus === "number" && (httpStatus >= 500 || httpStatus === 429)) {
    return true;
  }

  const errorCode = errorCodeFromDetails(details);
  if (errorCode && NON_RETRYABLE_EXPO_ERROR_CODES.has(errorCode)) {
    return false;
  }
  if (errorCode && RETRYABLE_EXPO_ERROR_CODES.has(errorCode)) {
    return true;
  }

  const text = (message ?? "").toLowerCase();
  if (text.includes("timeout") || text.includes("temporar") || text.includes("network")) {
    return true;
  }

  // Default to retryable if we cannot confidently classify as terminal.
  return true;
}

export async function sendExpoPushMessages(
  messages: ExpoPushMessage[],
  options: { expoAccessToken?: string } = {},
): Promise<ExpoSendResult> {
  const result: ExpoSendResult = {
    items: [],
    requestErrors: [],
  };

  if (messages.length === 0) {
    return result;
  }

  const chunks = chunkValues(messages, EXPO_MAX_MESSAGES_PER_REQUEST);
  const headers = buildExpoHeaders(options.expoAccessToken);

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_SEND_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const requestError = `expo_send_http_${response.status}`;
        result.requestErrors.push(requestError);

        for (const message of chunk) {
          result.items.push({
            message,
            ticket: {
              status: "error",
              message: `Expo push send failed with HTTP ${response.status}`,
              details: { error: requestError },
            },
            retryable: isRetryableExpoError(
              { error: requestError },
              `Expo push send failed with HTTP ${response.status}`,
              response.status,
            ),
          });
        }

        continue;
      }

      const payload = await response.json().catch(() => null);
      const ticketList = isPlainObject(payload) && Array.isArray(payload.data) ? payload.data : [];

      for (let index = 0; index < chunk.length; index += 1) {
        const message = chunk[index];
        const rawTicket = ticketList[index];

        if (!isPlainObject(rawTicket)) {
          const details = { error: "MissingTicket" };
          result.items.push({
            message,
            ticket: {
              status: "error",
              message: "Expo response did not include a matching ticket.",
              details,
            },
            retryable: true,
          });
          continue;
        }

        const status = rawTicket.status === "ok" ? "ok" : "error";
        const details = toJsonObject(rawTicket.details);
        const ticketMessage = typeof rawTicket.message === "string" ? rawTicket.message : undefined;
        const ticketId = typeof rawTicket.id === "string" ? rawTicket.id : undefined;

        result.items.push({
          message,
          ticket: {
            status,
            id: ticketId,
            message: ticketMessage,
            details,
          },
          retryable:
            status === "error" ? isRetryableExpoError(details, ticketMessage) : false,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown send error";
      result.requestErrors.push(`expo_send_network_error:${errorMessage}`);

      for (const message of chunk) {
        result.items.push({
          message,
          ticket: {
            status: "error",
            message: `Expo push send request failed: ${errorMessage}`,
            details: { error: "NetworkError" },
          },
          retryable: true,
        });
      }
    }
  }

  return result;
}

export async function getExpoPushReceipts(
  ticketIds: string[],
  options: { expoAccessToken?: string } = {},
): Promise<ExpoReceiptLookupResult> {
  const dedupedTicketIds = Array.from(new Set(ticketIds.filter((ticketId) => ticketId.length > 0)));

  const result: ExpoReceiptLookupResult = {
    receiptsByTicketId: {},
    requestErrors: [],
    missingTicketIds: [],
  };

  if (dedupedTicketIds.length === 0) {
    return result;
  }

  const chunks = chunkValues(dedupedTicketIds, EXPO_MAX_RECEIPT_IDS_PER_REQUEST);
  const headers = buildExpoHeaders(options.expoAccessToken);

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_RECEIPTS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ ids: chunk }),
      });

      if (!response.ok) {
        result.requestErrors.push(`expo_receipts_http_${response.status}`);
        continue;
      }

      const payload = await response.json().catch(() => null);
      const data = isPlainObject(payload) && isPlainObject(payload.data) ? payload.data : {};

      for (const ticketId of chunk) {
        const rawReceipt = data[ticketId];
        if (!isPlainObject(rawReceipt)) {
          continue;
        }

        const status = rawReceipt.status === "ok" ? "ok" : "error";
        result.receiptsByTicketId[ticketId] = {
          status,
          message: typeof rawReceipt.message === "string" ? rawReceipt.message : undefined,
          details: toJsonObject(rawReceipt.details),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown receipt error";
      result.requestErrors.push(`expo_receipts_network_error:${errorMessage}`);
    }
  }

  result.missingTicketIds = dedupedTicketIds.filter(
    (ticketId) => !(ticketId in result.receiptsByTicketId),
  );

  return result;
}

export function isDeviceNotRegisteredReceipt(receipt: ExpoPushReceipt): boolean {
  if (receipt.status !== "error" || !receipt.details) {
    return false;
  }

  const code = receipt.details.error;
  return typeof code === "string" && code === "DeviceNotRegistered";
}

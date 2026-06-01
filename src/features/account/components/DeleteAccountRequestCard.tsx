import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, TextField } from "@/components/ui";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  ACCOUNT_DELETION_REASON_MAX_LENGTH,
} from "@/features/account/constants";
import type { AccountDeletionRequest } from "@/features/account/types";
import { SettingsDangerZone } from "@/features/settings/components/SettingsDangerZone";
import { ConfirmationField } from "@/features/settings/components/ConfirmationField";
import { formatDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type DeleteAccountRequestCardProps = {
  currentRequest: AccountDeletionRequest | null;
  isRequesting: boolean;
  isCanceling: boolean;
  requestErrorMessage?: string | null;
  cancelErrorMessage?: string | null;
  onRequest: (input: { confirmation: string; reason?: string | null }) => Promise<unknown>;
  onCancelPending: (requestId: string) => Promise<unknown>;
};

function formatTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatDateTime(parsed);
}

function toStatusLabel(status: AccountDeletionRequest["status"]): string {
  switch (status) {
    case "pending":
      return "Scheduled";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "canceled":
      return "Canceled";
    case "failed":
      return "Needs attention";
    default:
      return "Unknown";
  }
}

export function DeleteAccountRequestCard({
  currentRequest,
  isRequesting,
  isCanceling,
  requestErrorMessage,
  cancelErrorMessage,
  onRequest,
  onCancelPending,
}: DeleteAccountRequestCardProps) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isConfirmationMatched = confirmation.trim() === ACCOUNT_DELETION_CONFIRMATION;
  const canCancelPending = currentRequest?.status === "pending";
  const hasActiveRequest = currentRequest?.status === "pending" || currentRequest?.status === "processing";
  const scheduledFor = formatTimestamp(currentRequest?.scheduled_for ?? null);

  const statusLines = useMemo(() => {
    if (!currentRequest) {
      return [];
    }

    const lines: string[] = [];
    const requestedAt = formatTimestamp(currentRequest.requested_at);
    if (requestedAt) {
      lines.push(`Requested: ${requestedAt}`);
    }

    if (scheduledFor) {
      lines.push(`Scheduled for: ${scheduledFor}`);
    }

    if (currentRequest.completed_at) {
      const completedAt = formatTimestamp(currentRequest.completed_at);
      if (completedAt) {
        lines.push(`Completed: ${completedAt}`);
      }
    }

    if (currentRequest.failed_at) {
      const failedAt = formatTimestamp(currentRequest.failed_at);
      if (failedAt) {
        lines.push(`Failed: ${failedAt}`);
      }
    }

    return lines;
  }, [currentRequest, scheduledFor]);

  return (
    <SettingsDangerZone
      description="This creates a server-side deletion request. Final deletion completes only after backend processing."
      title="Request account deletion"
    >
      <View style={styles.consequences}>
        <AppText color="textSecondary" variant="caption">
          - Deletion request is scheduled, not immediate.
        </AppText>
        <AppText color="textSecondary" variant="caption">
          - Push tokens will be disabled.
        </AppText>
        <AppText color="textSecondary" variant="caption">
          - Active couple space will be archived.
        </AppText>
        <AppText color="textSecondary" variant="caption">
          - Final deletion requires server-side completion.
        </AppText>
      </View>

      {currentRequest ? (
        <View style={styles.statusBlock}>
          <AppText variant="body">Current request: {toStatusLabel(currentRequest.status)}</AppText>
          {statusLines.map((line) => (
            <AppText key={line} color="textSecondary" variant="caption">
              {line}
            </AppText>
          ))}
        </View>
      ) : null}

      <ConfirmationField
        confirmationValue={ACCOUNT_DELETION_CONFIRMATION}
        disabled={hasActiveRequest || isRequesting}
        label="Type DELETE to continue"
        onChangeText={(value) => {
          setSuccessMessage(null);
          setConfirmation(value);
        }}
        value={confirmation}
      />

      <TextField
        accessibilityLabel="Deletion reason"
        editable={!hasActiveRequest && !isRequesting}
        label="Reason (optional)"
        maxLength={ACCOUNT_DELETION_REASON_MAX_LENGTH}
        multiline
        onChangeText={(value) => {
          setSuccessMessage(null);
          setReason(value);
        }}
        placeholder="Optional context to help support review this request."
        value={reason}
      />

      {requestErrorMessage ? (
        <AppText color="danger" variant="caption">
          {requestErrorMessage}
        </AppText>
      ) : null}

      {cancelErrorMessage ? (
        <AppText color="danger" variant="caption">
          {cancelErrorMessage}
        </AppText>
      ) : null}

      {successMessage ? (
        <AppText color="success" variant="caption">
          {successMessage}
        </AppText>
      ) : null}

      <Button
        disabled={hasActiveRequest || !isConfirmationMatched || isRequesting}
        loading={isRequesting}
        onPress={() => {
          const submit = async () => {
            try {
              await onRequest({
                confirmation: confirmation.trim(),
                reason: reason.trim().length > 0 ? reason.trim() : null,
              });
              setConfirmation("");
              setSuccessMessage("Deletion request submitted. You can track status here.");
            } catch {
              // Friendly errors are shown from the parent hook.
            }
          };

          void submit();
        }}
        title={hasActiveRequest ? "Request already in progress" : "Request account deletion"}
        variant="danger"
      />

      {canCancelPending ? (
        <Button
          disabled={isCanceling}
          loading={isCanceling}
          onPress={() => {
            if (!currentRequest) {
              return;
            }

            const cancelRequest = async () => {
              try {
                await onCancelPending(currentRequest.id);
                setSuccessMessage("Pending deletion request canceled.");
              } catch {
                // Friendly errors are shown from the parent hook.
              }
            };

            void cancelRequest();
          }}
          title="Cancel pending deletion request"
          variant="secondary"
        />
      ) : null}
    </SettingsDangerZone>
  );
}

const styles = StyleSheet.create({
  consequences: {
    gap: spacing.xs,
  },
  statusBlock: {
    gap: spacing.xs,
  },
});

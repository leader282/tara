import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import type { DataExportRequest } from "@/features/account/types";
import { formatDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type DataExportRequestCardProps = {
  requests: DataExportRequest[];
  isRequesting: boolean;
  errorMessage?: string | null;
  onRequest: () => Promise<unknown>;
};

function toStatusLabel(status: DataExportRequest["status"]): string {
  switch (status) {
    case "requested":
      return "Request received";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Needs attention";
    case "canceled":
      return "Canceled";
    default:
      return "Unknown";
  }
}

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

export function DataExportRequestCard({
  requests,
  isRequesting,
  errorMessage,
  onRequest,
}: DataExportRequestCardProps) {
  const latestRequest = requests[0] ?? null;
  const latestRequestedAt = formatTimestamp(latestRequest?.requested_at ?? null);
  const latestCompletedAt = formatTimestamp(latestRequest?.completed_at ?? null);
  const isActiveRequest = latestRequest?.status === "requested" || latestRequest?.status === "processing";

  const statusLines = useMemo(() => {
    if (!latestRequest) {
      return [];
    }

    const lines: string[] = [];
    if (latestRequestedAt) {
      lines.push(`Requested: ${latestRequestedAt}`);
    }

    if (latestCompletedAt) {
      lines.push(`Completed: ${latestCompletedAt}`);
    }

    if (latestRequest.failed_at) {
      const failedAt = formatTimestamp(latestRequest.failed_at);
      if (failedAt) {
        lines.push(`Failed: ${failedAt}`);
      }
    }

    return lines;
  }, [latestCompletedAt, latestRequest, latestRequestedAt]);

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="subtitle">Request data export</AppText>
          <AppText color="textSecondary" variant="caption">
            {latestRequest ? toStatusLabel(latestRequest.status) : "No request yet"}
          </AppText>
        </View>

        <AppText color="textSecondary" variant="bodyMuted">
          This starts an export request placeholder. File generation is not instant in this phase.
        </AppText>

        {statusLines.map((line) => (
          <AppText key={line} color="textSecondary" variant="caption">
            {line}
          </AppText>
        ))}

        {errorMessage ? (
          <AppText color="danger" variant="caption">
            {errorMessage}
          </AppText>
        ) : null}

        <Button
          disabled={isRequesting || isActiveRequest}
          loading={isRequesting}
          onPress={() => {
            const submit = async () => {
              try {
                await onRequest();
              } catch {
                // Friendly errors are shown by parent hook state.
              }
            };

            void submit();
          }}
          title={isActiveRequest ? "Request already in progress" : "Request data export"}
          variant="secondary"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

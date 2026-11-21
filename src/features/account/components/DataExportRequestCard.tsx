import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Badge, type BadgeTone, Button, Card, Icon, InlineMessage } from "@/components/ui";
import type { DataExportRequest } from "@/features/account/types";
import { formatDateTime } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";

type DataExportRequestCardProps = {
  requests: DataExportRequest[];
  isRequesting: boolean;
  errorMessage?: string | null;
  onRequest: () => Promise<unknown>;
};

function toStatusPresentation(status: DataExportRequest["status"]): { label: string; tone: BadgeTone } {
  switch (status) {
    case "requested":
      return { label: "Request received", tone: "info" };
    case "processing":
      return { label: "Processing", tone: "warning" };
    case "completed":
      return { label: "Completed", tone: "success" };
    case "failed":
      return { label: "Needs attention", tone: "danger" };
    case "canceled":
      return { label: "Canceled", tone: "neutral" };
    default:
      return { label: "Unknown", tone: "neutral" };
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
  const isActiveRequest =
    latestRequest?.status === "requested" || latestRequest?.status === "processing";
  const statusPresentation = latestRequest
    ? toStatusPresentation(latestRequest.status)
    : { label: "No request yet", tone: "neutral" as const };

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
          <View style={styles.iconWell}>
            <Icon color="info" name="download-outline" size={20} />
          </View>
          <AppText style={styles.title} variant="subtitle">
            Data export
          </AppText>
          <Badge label={statusPresentation.label} tone={statusPresentation.tone} />
        </View>

        <AppText color="textSecondary" variant="bodyMuted">
          Ask for a copy of everything you&apos;ve shared in Tara. Preparing it takes a while.
        </AppText>

        {statusLines.length > 0 ? (
          <View style={styles.lines}>
            {statusLines.map((line) => (
              <AppText color="textSecondary" key={line} variant="caption">
                {line}
              </AppText>
            ))}
          </View>
        ) : null}

        {errorMessage ? <InlineMessage message={errorMessage} tone="danger" /> : null}

        <Button
          disabled={isRequesting || isActiveRequest}
          icon="download-outline"
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
          variant="outline"
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
    gap: spacing.md,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.infoSoft,
    borderRadius: radii.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  title: {
    flex: 1,
  },
  lines: {
    gap: spacing.xs,
  },
});

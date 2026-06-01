import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useRouter } from "expo-router";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAccountDeletionRequest } from "@/features/account/hooks/useAccountDeletionRequest";
import { useCancelAccountDeletionRequest } from "@/features/account/hooks/useCancelAccountDeletionRequest";
import { useDataExportRequest } from "@/features/account/hooks/useDataExportRequest";
import { useLeaveCouple } from "@/features/account/hooks/useLeaveCouple";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { AccountRequestStatusCard } from "@/features/account/components/AccountRequestStatusCard";
import { DataExportRequestCard } from "@/features/account/components/DataExportRequestCard";
import { DeleteAccountRequestCard } from "@/features/account/components/DeleteAccountRequestCard";
import { UnpairConfirmationCard } from "@/features/account/components/UnpairConfirmationCard";
import { formatDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

function toCoupleStatusLabel(status: "none" | "waiting" | "paired"): string {
  switch (status) {
    case "paired":
      return "Paired";
    case "waiting":
      return "Waiting for partner";
    case "none":
      return "Not paired";
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

export function AccountSafetyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const activeCoupleState = useActiveCoupleState();
  const leaveCoupleMutation = useLeaveCouple();
  const accountDeletion = useAccountDeletionRequest(user?.id);
  const cancelAccountDeletionMutation = useCancelAccountDeletionRequest();
  const dataExport = useDataExportRequest(user?.id);

  const latestDataExportRequest = dataExport.requests[0] ?? null;
  const coupleStatus =
    activeCoupleState.state.status === "loading"
      ? "none"
      : activeCoupleState.state.status;

  const statusDetails = useMemo(() => {
    const lines: string[] = [];

    if (accountDeletion.currentRequest) {
      lines.push(`Deletion request: ${accountDeletion.currentRequest.status}`);
      const scheduledAt = formatTimestamp(accountDeletion.currentRequest.scheduled_for);
      if (scheduledAt) {
        lines.push(`Scheduled for: ${scheduledAt}`);
      }
    } else {
      lines.push("Deletion request: none");
    }

    if (latestDataExportRequest) {
      lines.push(`Latest export request: ${latestDataExportRequest.status}`);
      const requestedAt = formatTimestamp(latestDataExportRequest.requested_at);
      if (requestedAt) {
        lines.push(`Export requested: ${requestedAt}`);
      }
    } else {
      lines.push("Latest export request: none");
    }

    return lines;
  }, [accountDeletion.currentRequest, latestDataExportRequest]);

  if (!user?.id) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="Please sign in to access account safety settings."
          title="Sign-in required"
        />
      </Screen>
    );
  }

  const isLoading =
    activeCoupleState.isLoading ||
    activeCoupleState.state.status === "loading" ||
    accountDeletion.isLoadingCurrentRequest ||
    dataExport.isLoadingRequests;

  if (isLoading) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading account safety settings..." />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <AccountRequestStatusCard
        description="Requests are server-validated and processed in the background."
        details={statusDetails}
        statusLabel={toCoupleStatusLabel(coupleStatus)}
        title="Current account status"
      />

      <UnpairConfirmationCard
        errorMessage={leaveCoupleMutation.friendlyError}
        isPaired={activeCoupleState.state.status === "paired"}
        isSubmitting={leaveCoupleMutation.isPending}
        onConfirm={async (confirmation) => {
          await leaveCoupleMutation.mutateAsync(confirmation);
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.replace("/");
        }}
      />

      <DataExportRequestCard
        errorMessage={dataExport.requestExportErrorMessage ?? dataExport.requestsErrorMessage}
        isRequesting={dataExport.isRequestingExport}
        onRequest={dataExport.requestExport}
        requests={dataExport.requests}
      />

      <DeleteAccountRequestCard
        cancelErrorMessage={cancelAccountDeletionMutation.friendlyError}
        currentRequest={accountDeletion.currentRequest}
        isCanceling={cancelAccountDeletionMutation.isPending}
        isRequesting={accountDeletion.isRequestingDeletion}
        onCancelPending={cancelAccountDeletionMutation.mutateAsync}
        onRequest={accountDeletion.requestDeletion}
        requestErrorMessage={accountDeletion.requestDeletionErrorMessage}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  loading: {
    justifyContent: "center",
  },
});

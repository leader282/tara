import { useRouter } from "expo-router";

import { useGoBack } from "@/components/navigation/useGoBack";
import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAccountDeletionRequest } from "@/features/account/hooks/useAccountDeletionRequest";
import { useCancelAccountDeletionRequest } from "@/features/account/hooks/useCancelAccountDeletionRequest";
import { useDataExportRequest } from "@/features/account/hooks/useDataExportRequest";
import { useLeaveCouple } from "@/features/account/hooks/useLeaveCouple";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { DataExportRequestCard } from "@/features/account/components/DataExportRequestCard";
import { DeleteAccountRequestCard } from "@/features/account/components/DeleteAccountRequestCard";
import { UnpairConfirmationCard } from "@/features/account/components/UnpairConfirmationCard";

export function AccountSafetyScreen() {
  const router = useRouter();
  const goBack = useGoBack("/(settings)");
  const { user } = useAuth();
  const activeCoupleState = useActiveCoupleState();
  const leaveCoupleMutation = useLeaveCouple();
  const accountDeletion = useAccountDeletionRequest(user?.id);
  const cancelAccountDeletionMutation = useCancelAccountDeletionRequest();
  const dataExport = useDataExportRequest(user?.id);

  if (!user?.id) {
    return (
      <Screen centered onBack={goBack}>
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
      <Screen centered onBack={goBack}>
        <LoadingState label="Loading account safety settings..." />
      </Screen>
    );
  }

  return (
    <Screen
      onBack={goBack}
      scroll
      subtitle="Careful controls for your account and your shared space."
      title="Account and safety"
    >
      <DataExportRequestCard
        errorMessage={dataExport.requestExportErrorMessage ?? dataExport.requestsErrorMessage}
        isRequesting={dataExport.isRequestingExport}
        onRequest={dataExport.requestExport}
        requests={dataExport.requests}
      />

      <UnpairConfirmationCard
        errorMessage={leaveCoupleMutation.friendlyError}
        isPaired={activeCoupleState.state.status === "paired"}
        isSubmitting={leaveCoupleMutation.isPending}
        onConfirm={async (confirmation) => {
          await leaveCoupleMutation.mutateAsync(confirmation);
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Not "/": inside the settings group that resolves to the settings home.
          router.replace("/(invite)");
        }}
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

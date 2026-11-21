import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
import { Card, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { RitualLockedState } from "@/features/rituals/components/RitualLockedState";
import { RitualPromptCard } from "@/features/rituals/components/RitualPromptCard";
import { RitualResponseForm } from "@/features/rituals/components/RitualResponseForm";
import { RitualRevealedResult } from "@/features/rituals/components/RitualRevealedResult";
import { getRitualSavedToast } from "@/features/rituals/feedback";
import { useCompleteRitual } from "@/features/rituals/hooks/useCompleteRitual";
import { useRitualDetail } from "@/features/rituals/hooks/useRitualDetail";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

export function RitualDetailScreen() {
  const router = useRouter();
  const goBack = useGoBack("/(couple)/rituals");
  const params = useLocalSearchParams<{ ritualId?: string | string[] }>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const routeRitualId = Array.isArray(params.ritualId) ? params.ritualId[0] : params.ritualId;
  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const partnerDisplayName = pairedData?.partnerProfile.display_name ?? "Partner";
  const currentUserId = user?.id ?? null;

  const ritualDetail = useRitualDetail(routeRitualId ?? null, currentUserId);
  const completeRitualMutation = useCompleteRitual(coupleId);

  const handleRetryCoupleHome = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleRetryRitualDetail = () => {
    if (!routeRitualId || !currentUserId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.rituals.detail(routeRitualId, currentUserId),
    });
  };

  const handleSubmitResponse = async ({
    textResponse,
    mediaAssetIds,
  }: {
    textResponse?: string | null;
    mediaAssetIds?: string[];
  }) => {
    if (!routeRitualId) {
      return;
    }

    try {
      const result = await completeRitualMutation.mutateAsync({
        coupleRitualId: routeRitualId,
        textResponse,
        mediaAssetIds,
      });
      toast.show(getRitualSavedToast(result.is_revealed, partnerDisplayName));
    } catch {
      // Friendly message comes from mutation state.
    }
  };

  const screenProps = {
    backLabel: "Back to rituals",
    onBack: goBack,
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen centered {...screenProps}>
        <LoadingState label="Loading ritual details..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered {...screenProps}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't load ritual details right now."}
          onRetry={handleRetryCoupleHome}
          title="Couldn't open ritual details"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen centered {...screenProps}>
        <EmptyState description="Pair first to view ritual details." title="Ritual unavailable" />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen centered {...screenProps}>
        <EmptyState
          actionLabel="View invite"
          description="Ritual details unlock after your partner joins."
          onActionPress={() => router.replace("/(invite)/waiting")}
          title="Waiting for your partner"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "invariant_error") {
    return (
      <Screen centered {...screenProps}>
        <ErrorState
          message="We found an unexpected couple setup issue. Please try again."
          onRetry={handleRetryCoupleHome}
          title="Ritual details unavailable"
        />
      </Screen>
    );
  }

  if (!routeRitualId) {
    return (
      <Screen centered {...screenProps}>
        <ErrorState
          message="This ritual link looks incomplete. Please open it again from ritual history."
          title="Ritual not found"
        />
      </Screen>
    );
  }

  if (ritualDetail.isLoading) {
    return (
      <Screen centered {...screenProps}>
        <LoadingState label="Loading ritual details..." />
      </Screen>
    );
  }

  if (ritualDetail.error || !ritualDetail.ritual) {
    return (
      <Screen centered {...screenProps}>
        <ErrorState
          message={ritualDetail.friendlyError ?? "We couldn't open this ritual right now."}
          onRetry={handleRetryRitualDetail}
          title="Couldn't load ritual"
        />
      </Screen>
    );
  }

  const detail = ritualDetail.ritual;

  return (
    <Screen
      {...screenProps}
      scroll
      subtitle="A calm space for one shared prompt."
      title="Ritual detail"
    >
      <RitualPromptCard
        coupleRitual={detail.coupleRitual}
        heading="Shared prompt"
        template={detail.template}
      />

      <Card>
        <View style={styles.stateSection}>
          {!detail.revealState.hasCompleted ? (
            <RitualResponseForm
              inputType={detail.template.input_type}
              isSubmitting={completeRitualMutation.isPending}
              onSubmit={handleSubmitResponse}
              submitError={completeRitualMutation.friendlyError}
            />
          ) : null}

          {detail.revealState.hasCompleted && !detail.revealState.isRevealed ? (
            <RitualLockedState partnerDisplayName={partnerDisplayName} />
          ) : null}

          {detail.revealState.isRevealed ? (
            <RitualRevealedResult
              completedAt={detail.coupleRitual.updated_at}
              myCompletion={detail.myCompletion}
              partnerCompletion={detail.partnerCompletion}
              partnerDisplayName={partnerDisplayName}
            />
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stateSection: {
    gap: spacing.md,
  },
});

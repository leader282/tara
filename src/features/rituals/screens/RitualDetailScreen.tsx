import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText, Button, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { RitualLockedState } from "@/features/rituals/components/RitualLockedState";
import { RitualPromptCard } from "@/features/rituals/components/RitualPromptCard";
import { RitualResponseForm } from "@/features/rituals/components/RitualResponseForm";
import { RitualRevealedResult } from "@/features/rituals/components/RitualRevealedResult";
import { useCompleteRitual } from "@/features/rituals/hooks/useCompleteRitual";
import { useRitualDetail } from "@/features/rituals/hooks/useRitualDetail";
import { useRitualRealtime } from "@/features/rituals/hooks/useRitualRealtime";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

export function RitualDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ritualId?: string | string[] }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const routeRitualId = Array.isArray(params.ritualId) ? params.ritualId[0] : params.ritualId;
  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const partnerDisplayName = pairedData?.partnerProfile.display_name ?? "Partner";
  const currentUserId = user?.id ?? null;

  const ritualDetail = useRitualDetail(routeRitualId ?? null, currentUserId);
  const completeRitualMutation = useCompleteRitual(coupleId);

  useRitualRealtime(coupleId, coupleHome.state.status === "paired");

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
    mediaAssetId,
  }: {
    textResponse?: string | null;
    mediaAssetId?: string | null;
  }) => {
    if (!routeRitualId) {
      return;
    }

    try {
      await completeRitualMutation.mutateAsync({
        coupleRitualId: routeRitualId,
        textResponse,
        mediaAssetId,
      });
    } catch {
      // Friendly message comes from mutation state.
    }
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading ritual details..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
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
      <Screen contentContainerStyle={styles.content}>
        <EmptyState description="Pair first to view ritual details." title="Ritual unavailable" />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen contentContainerStyle={styles.content}>
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
      <Screen contentContainerStyle={styles.centered}>
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
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message="This ritual link looks incomplete. Please open it again from ritual history."
          title="Ritual not found"
        />
      </Screen>
    );
  }

  if (ritualDetail.isLoading) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading ritual details..." />
      </Screen>
    );
  }

  if (ritualDetail.error || !ritualDetail.ritual) {
    return (
      <Screen contentContainerStyle={styles.centered}>
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
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Ritual detail</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          A calm space for one shared prompt.
        </AppText>
      </View>

      <RitualPromptCard coupleRitual={detail.coupleRitual} heading="Ritual detail" template={detail.template} />

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
          <RitualLockedState />
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

      <Button
        onPress={() => {
          router.replace("/(couple)/rituals");
        }}
        title="Back to rituals"
        variant="ghost"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  centered: {
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
  stateSection: {
    gap: spacing.md,
  },
});

import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { AppText, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { RitualHistoryList } from "@/features/rituals/components/RitualHistoryList";
import { TodayRitualCard } from "@/features/rituals/components/TodayRitualCard";
import { useCompleteRitual } from "@/features/rituals/hooks/useCompleteRitual";
import { useRitualHistory } from "@/features/rituals/hooks/useRitualHistory";
import { useRitualRealtime } from "@/features/rituals/hooks/useRitualRealtime";
import { useTodayRitual } from "@/features/rituals/hooks/useTodayRitual";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

export function RitualsHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const currentUserId = user?.id ?? null;
  const partnerDisplayName = pairedData?.partnerProfile.display_name ?? "Partner";

  const todayRitual = useTodayRitual(coupleId, currentUserId);
  const ritualHistory = useRitualHistory(coupleId);
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

  const handleOpenRitualDetail = (ritualId: string) => {
    router.push({
      pathname: "/(couple)/rituals/[ritualId]",
      params: { ritualId },
    });
  };

  const handleSubmitResponse = async ({
    coupleRitualId,
    textResponse,
    mediaAssetId,
  }: {
    coupleRitualId: string;
    textResponse?: string | null;
    mediaAssetId?: string | null;
  }) => {
    try {
      await completeRitualMutation.mutateAsync({
        coupleRitualId,
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
        <LoadingState label="Loading your ritual space..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't load your ritual space right now."}
          onRetry={handleRetryCoupleHome}
          title="Couldn't open rituals"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen contentContainerStyle={styles.content}>
        <EmptyState
          actionLabel="Open invite setup"
          description="Your rituals unlock once your couple space is active."
          onActionPress={() => router.replace("/(invite)")}
          title="Your ritual space is waiting"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen contentContainerStyle={styles.content}>
        <EmptyState
          actionLabel="View invite"
          description="Daily rituals will appear once your partner joins."
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
          title="Rituals need attention"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Rituals</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Small prompts you both answer in your own time, from wherever you are.
        </AppText>
      </View>

      <TodayRitualCard
        isSubmitting={completeRitualMutation.isPending}
        onRetry={() => {
          void todayRitual.refetch();
        }}
        onSubmitResponse={handleSubmitResponse}
        partnerDisplayName={partnerDisplayName}
        state={todayRitual.state}
        submitError={completeRitualMutation.friendlyError}
      />

      <RitualHistoryList
        errorMessage={ritualHistory.friendlyError}
        history={ritualHistory.history}
        isLoading={ritualHistory.isLoading}
        onItemPress={handleOpenRitualDetail}
        onRetry={() => {
          if (!coupleId) {
            return;
          }

          void queryClient.invalidateQueries({
            queryKey: queryKeys.rituals.historyList(coupleId),
          });
        }}
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
});

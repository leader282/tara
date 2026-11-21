import { useState } from "react";
import { RefreshControl } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { useToast } from "@/components/feedback/ToastProvider";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { RitualHistoryList } from "@/features/rituals/components/RitualHistoryList";
import { TodayRitualCard } from "@/features/rituals/components/TodayRitualCard";
import { getRitualSavedToast } from "@/features/rituals/feedback";
import { useCompleteRitual } from "@/features/rituals/hooks/useCompleteRitual";
import { useRitualHistory } from "@/features/rituals/hooks/useRitualHistory";
import { useTodayRitual } from "@/features/rituals/hooks/useTodayRitual";
import { queryKeys } from "@/lib/query/queryKeys";
import { colors } from "@/theme/tokens";

export function RitualsHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const currentUserId = user?.id ?? null;
  const partnerDisplayName = pairedData?.partnerProfile.display_name ?? "Partner";

  const todayRitual = useTodayRitual(coupleId, currentUserId);
  const ritualHistory = useRitualHistory(coupleId);
  const completeRitualMutation = useCompleteRitual(coupleId);

  const handleRetryCoupleHome = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleRefresh = async () => {
    if (!coupleId) {
      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all([
        todayRitual.refetch(),
        queryClient.invalidateQueries({ queryKey: queryKeys.rituals.historyList(coupleId) }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
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
    mediaAssetIds,
  }: {
    coupleRitualId: string;
    textResponse?: string | null;
    mediaAssetIds?: string[];
  }) => {
    try {
      const result = await completeRitualMutation.mutateAsync({
        coupleRitualId,
        textResponse,
        mediaAssetIds,
      });
      toast.show(getRitualSavedToast(result.is_revealed, partnerDisplayName));
    } catch {
      // Friendly message comes from mutation state.
    }
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen centered edges={["top"]}>
        <LoadingState label="Loading your ritual space..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered edges={["top"]}>
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
      <Screen centered edges={["top"]}>
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
      <Screen centered edges={["top"]}>
        <EmptyState
          actionLabel="View invite"
          description="Daily rituals will appear once your partner joins."
          icon="hourglass-outline"
          onActionPress={() => router.replace("/(invite)/waiting")}
          title="Waiting for your partner"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "invariant_error") {
    return (
      <Screen centered edges={["top"]}>
        <ErrorState
          message="We found an unexpected couple setup issue. Please try again."
          onRetry={handleRetryCoupleHome}
          title="Rituals need attention"
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={["top"]}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={() => void handleRefresh()}
          refreshing={isRefreshing}
          tintColor={colors.primary}
        />
      }
      scroll
      subtitle="Small prompts you both answer in your own time, from wherever you are."
      title="Rituals"
    >
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

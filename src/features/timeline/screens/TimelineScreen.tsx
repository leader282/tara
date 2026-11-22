import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { AppText, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { TimelineList } from "@/features/timeline/components/TimelineList";
import { useTimeline } from "@/features/timeline/hooks/useTimeline";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

function TimelineHeader() {
  return (
    <View style={styles.titleBlock}>
      <AppText accessibilityRole="header" variant="title">
        Your private timeline
      </AppText>
      <AppText color="textSecondary" variant="bodyMuted">
        Small moments you&apos;ve shared in the last 7 days.
      </AppText>
    </View>
  );
}

export function TimelineScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const timeline = useTimeline(coupleId);

  const handleRetryCoupleHome = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleRefreshTimeline = () => {
    void timeline.refetch();
  };

  const handleLoadMoreTimeline = () => {
    if (!timeline.hasNextPage || timeline.isFetchingNextPage) {
      return;
    }

    void timeline.fetchNextPage();
  };

  const getActorName = (actorId: string | null) => {
    if (!actorId || !pairedData) {
      return null;
    }

    return actorId === user?.id ? "You" : pairedData.partnerProfile.display_name;
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen centered edges={["top"]}>
        <LoadingState label="Loading your private timeline..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered edges={["top"]}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't open your timeline right now."}
          onRetry={handleRetryCoupleHome}
          title="Couldn't open timeline"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen centered edges={["top"]}>
        <EmptyState
          actionLabel="Open invite setup"
          description="Your timeline appears once your couple space is active."
          onActionPress={() => router.replace("/(invite)")}
          title="Timeline unavailable"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen centered edges={["top"]}>
        <EmptyState
          actionLabel="View invite"
          description="Your timeline unlocks after your partner joins."
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
          title="Timeline needs attention"
        />
      </Screen>
    );
  }

  if (timeline.isLoading && timeline.items.length === 0) {
    return (
      <Screen centered edges={["top"]}>
        <LoadingState label="Loading your private timeline..." />
      </Screen>
    );
  }

  if (timeline.error && timeline.items.length === 0) {
    return (
      <Screen centered edges={["top"]}>
        <ErrorState
          message={timeline.friendlyError ?? "We couldn't load timeline moments right now."}
          onRetry={handleRefreshTimeline}
          title="Couldn't load timeline"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.listScreen} edges={["top"]}>
      <TimelineList
        errorMessage={timeline.items.length > 0 ? timeline.friendlyError : null}
        hasNextPage={timeline.hasNextPage}
        header={<TimelineHeader />}
        isFetchingNextPage={timeline.isFetchingNextPage}
        isRefreshing={timeline.isRefreshing}
        getActorName={getActorName}
        items={timeline.items}
        onLoadMore={handleLoadMoreTimeline}
        onRefresh={handleRefreshTimeline}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listScreen: {
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  titleBlock: {
    gap: spacing.xs,
  },
});

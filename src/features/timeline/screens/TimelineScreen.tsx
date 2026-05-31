import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { AppText, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { TimelineList } from "@/features/timeline/components/TimelineList";
import { useTimeline } from "@/features/timeline/hooks/useTimeline";
import { useTimelineRealtime } from "@/features/timeline/hooks/useTimelineRealtime";
import type { TimelineDisplayItem, TimelineNavigationTarget } from "@/features/timeline/types";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

function navigateToTimelineTarget(
  target: TimelineNavigationTarget,
  navigate: ReturnType<typeof useRouter>["push"],
  replace: ReturnType<typeof useRouter>["replace"]
): void {
  if (!target) {
    return;
  }

  switch (target.pathname) {
    case "/(couple)":
      replace(target.pathname);
      return;
    case "/(couple)/edit-meetup":
      navigate(target.pathname);
      return;
    case "/(couple)/rituals/[ritualId]":
      navigate({
        pathname: target.pathname,
        params: target.params,
      });
      return;
    case "/(couple)/capsules/[capsuleId]":
      navigate({
        pathname: target.pathname,
        params: target.params,
      });
      return;
    default:
      return;
  }
}

export function TimelineScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const timeline = useTimeline(coupleId);

  useTimelineRealtime(coupleId, coupleHome.state.status === "paired");

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

  const handleTimelineItemPress = (item: TimelineDisplayItem) => {
    navigateToTimelineTarget(item.navigationTarget, router.push, router.replace);
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading your private timeline..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
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
      <Screen contentContainerStyle={styles.content}>
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
      <Screen contentContainerStyle={styles.content}>
        <EmptyState
          actionLabel="View invite"
          description="Your timeline unlocks after your partner joins."
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
          title="Timeline needs attention"
        />
      </Screen>
    );
  }

  if (timeline.isLoading && timeline.items.length === 0) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading your private timeline..." />
      </Screen>
    );
  }

  if (timeline.error && timeline.items.length === 0) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message={timeline.friendlyError ?? "We couldn't load timeline moments right now."}
          onRetry={handleRefreshTimeline}
          title="Couldn't load timeline"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title">Your private timeline</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Small moments you&apos;ve saved together.
        </AppText>
      </View>

      <View style={styles.listContainer}>
        <TimelineList
          errorMessage={timeline.items.length > 0 ? timeline.friendlyError : null}
          hasNextPage={timeline.hasNextPage}
          isFetchingNextPage={timeline.isFetchingNextPage}
          isRefreshing={timeline.isRefreshing}
          items={timeline.items}
          onItemPress={handleTimelineItemPress}
          onLoadMore={handleLoadMoreTimeline}
          onRefresh={handleRefreshTimeline}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
  },
  centered: {
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
});

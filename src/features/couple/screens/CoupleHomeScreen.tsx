import { useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { EmptyState, ErrorState, Screen, Skeleton } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { HomeHeader } from "@/features/couple/components/HomeHeader";
import { HomeShortcuts } from "@/features/couple/components/HomeShortcuts";
import { PartnerHeroCard } from "@/features/couple/components/PartnerHeroCard";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { PresencePulsePanel } from "@/features/presence/components/PresencePulsePanel";
import { RecentPulsesCard } from "@/features/presence/components/RecentPulsesCard";
import { useRecentPresencePulses } from "@/features/presence/hooks/useRecentPresencePulses";
import { queryKeys } from "@/lib/query/queryKeys";
import { colors, radii, spacing } from "@/theme/tokens";

function HomeSkeleton() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonHeader}>
        <Skeleton height={12} width="40%" />
        <Skeleton height={30} width="70%" />
      </View>
      <Skeleton height={248} radius={radii.xl} />
      <View style={styles.skeletonRow}>
        <Skeleton height={112} radius={radii.lg} style={styles.skeletonTile} />
        <Skeleton height={112} radius={radii.lg} style={styles.skeletonTile} />
      </View>
      <Skeleton height={300} radius={radii.lg} />
    </View>
  );
}

export function CoupleHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();
  const pairedCoupleId =
    coupleHome.state.status === "paired" ? coupleHome.state.data.couple.id : null;
  const recentPresencePulses = useRecentPresencePulses(pairedCoupleId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRetry = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleRefresh = async () => {
    if (!user?.id) {
      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.couple.home(user.id) }),
        pairedCoupleId
          ? queryClient.invalidateQueries({
              queryKey: queryKeys.presence.recentList(pairedCoupleId),
            })
          : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen edges={["top"]} scroll>
        <HomeSkeleton />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered edges={["top"]}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't load your couple home right now."}
          onRetry={handleRetry}
          title="Couldn’t open your space"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen centered edges={["top"]}>
        <EmptyState
          actionLabel="Open invite setup"
          description="Your couple space is not active yet. You can continue from the invite flow."
          icon="people-outline"
          onActionPress={() => router.replace("/(invite)")}
          title="Your couple home is waiting"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen centered edges={["top"]}>
        <EmptyState
          actionLabel="View invite"
          description="Your space is ready. It unlocks fully once your partner joins."
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
          message="We found an unexpected couple setup issue. Please try again in a moment."
          onRetry={handleRetry}
          title="Couple setup needs attention"
        />
      </Screen>
    );
  }

  const coupleHomeData = coupleHome.state.data;
  const partnerDisplayName = coupleHomeData.partnerProfile.display_name;

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
      testID="couple-home"
    >
      <HomeHeader
        displayName={coupleHomeData.currentUserProfile.display_name}
        onOpenSettings={() => router.push("/(settings)")}
      />
      <PartnerHeroCard
        nextMeetupAt={coupleHomeData.nextMeetupAt}
        nextMeetupLocation={coupleHomeData.nextMeetupLocation}
        onEditMeetup={() => router.push("/(couple)/edit-meetup")}
        partnerProfile={coupleHomeData.partnerProfile}
      />
      <HomeShortcuts
        onCreateCapsule={() => router.push("/(couple)/capsules/create")}
        onOpenRituals={() => router.navigate("/(couple)/rituals")}
      />
      <PresencePulsePanel partnerDisplayName={partnerDisplayName} />
      <RecentPulsesCard
        currentUserId={user?.id ?? ""}
        errorMessage={recentPresencePulses.friendlyError}
        isLoading={recentPresencePulses.isLoading}
        partnerDisplayName={partnerDisplayName}
        pulses={recentPresencePulses.pulses}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    gap: spacing.lg,
  },
  skeletonHeader: {
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  skeletonTile: {
    flex: 1,
  },
});

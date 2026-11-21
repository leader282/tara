import { useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  Screen,
  Skeleton,
} from "@/components/ui";
import { CapsuleEmptyState } from "@/features/capsules/components/CapsuleEmptyState";
import { CapsuleList } from "@/features/capsules/components/CapsuleList";
import { useCapsules } from "@/features/capsules/hooks/useCapsules";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { queryKeys } from "@/lib/query/queryKeys";
import { colors, radii, spacing } from "@/theme/tokens";

export function CapsulesHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const currentUserId = user?.id ?? null;

  const capsules = useCapsules(coupleId, currentUserId);
  const hasCapsules = !capsules.isLoading && !capsules.error && capsules.capsules.length > 0;

  const handleRetryCoupleHome = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleRetryCapsules = () => {
    if (!coupleId || !currentUserId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.capsules.list(coupleId, currentUserId),
    });
  };

  const handleRefresh = async () => {
    if (!coupleId || !currentUserId) {
      return;
    }

    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.capsules.list(coupleId, currentUserId),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenCreate = () => {
    router.push("/(couple)/capsules/create");
  };

  const handleOpenCapsule = (capsuleId: string) => {
    router.push({
      pathname: "/(couple)/capsules/[capsuleId]",
      params: { capsuleId },
    });
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen centered edges={["top"]}>
        <LoadingState label="Loading your memory capsules..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered edges={["top"]}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't open memory capsules right now."}
          onRetry={handleRetryCoupleHome}
          title="Couldn't open capsules"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen centered edges={["top"]}>
        <EmptyState
          actionLabel="Open invite setup"
          description="Memory capsules appear once your couple space is active."
          onActionPress={() => router.replace("/(invite)")}
          title="Your capsule space is waiting"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen centered edges={["top"]}>
        <EmptyState
          actionLabel="View invite"
          description="You can start capsules as soon as your partner joins."
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
          title="Capsules need attention"
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
      subtitle="Save something now and open it together on a future day."
      title="Memory capsules"
    >
      {hasCapsules ? (
        <Card>
          <View style={styles.createCard}>
            <View style={styles.createHeader}>
              <View style={styles.createIcon}>
                <Icon color="primaryStrong" name="gift" size={22} />
              </View>
              <AppText color="textSecondary" style={styles.createCopy} variant="bodyMuted">
                Your partner sees that a capsule is waiting, but not what&apos;s inside.
              </AppText>
            </View>
            <Button icon="add" onPress={handleOpenCreate} title="Create capsule" />
          </View>
        </Card>
      ) : null}

      {capsules.isLoading ? (
        <View style={styles.skeletonList}>
          <Skeleton height={96} radius={radii.lg} />
          <Skeleton height={96} radius={radii.lg} />
        </View>
      ) : null}

      {!capsules.isLoading && capsules.error ? (
        <Card>
          <ErrorState
            message={capsules.friendlyError ?? "We couldn't load your memory capsules right now."}
            onRetry={handleRetryCapsules}
            title="Couldn't load capsules"
          />
        </Card>
      ) : null}

      {!capsules.isLoading && !capsules.error && !hasCapsules ? (
        <CapsuleEmptyState onCreatePress={handleOpenCreate} />
      ) : null}

      {hasCapsules ? (
        <CapsuleList capsules={capsules.capsules} onCapsulePress={handleOpenCapsule} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  createCard: {
    gap: spacing.lg,
  },
  createHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  createIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  createCopy: {
    flex: 1,
  },
  skeletonList: {
    gap: spacing.md,
  },
});

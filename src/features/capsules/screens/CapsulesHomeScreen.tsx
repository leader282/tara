import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { CapsuleEmptyState } from "@/features/capsules/components/CapsuleEmptyState";
import { CapsuleList } from "@/features/capsules/components/CapsuleList";
import { useCapsuleRealtime } from "@/features/capsules/hooks/useCapsuleRealtime";
import { useCapsules } from "@/features/capsules/hooks/useCapsules";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

export function CapsulesHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const currentUserId = user?.id ?? null;

  const capsules = useCapsules(coupleId, currentUserId);

  useCapsuleRealtime(coupleId, null, coupleHome.state.status === "paired");

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
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading your memory capsules..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
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
      <Screen contentContainerStyle={styles.content}>
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
      <Screen contentContainerStyle={styles.content}>
        <EmptyState
          actionLabel="View invite"
          description="You can start capsules as soon as your partner joins."
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
          title="Capsules need attention"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Memory capsules</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Save something for a future day.
        </AppText>
      </View>

      <Card>
        <View style={styles.createCard}>
          <AppText color="textSecondary" variant="bodyMuted">
            Your partner can see that a capsule exists, and the note opens later.
          </AppText>
          <Button onPress={handleOpenCreate} title="Create capsule" />
        </View>
      </Card>

      {capsules.isLoading ? (
        <Card>
          <LoadingState label="Loading memory capsules..." />
        </Card>
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

      {!capsules.isLoading && !capsules.error && capsules.capsules.length === 0 ? (
        <CapsuleEmptyState onCreatePress={handleOpenCreate} />
      ) : null}

      {!capsules.isLoading && !capsules.error && capsules.capsules.length > 0 ? (
        <CapsuleList capsules={capsules.capsules} onCapsulePress={handleOpenCapsule} />
      ) : null}
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
  createCard: {
    gap: spacing.md,
  },
});

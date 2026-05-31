import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText, Button, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { CapsuleLockedState } from "@/features/capsules/components/CapsuleLockedState";
import { CapsuleOpenableState } from "@/features/capsules/components/CapsuleOpenableState";
import { CapsuleOpenedContent } from "@/features/capsules/components/CapsuleOpenedContent";
import { CapsulePreviewCard } from "@/features/capsules/components/CapsulePreviewCard";
import { useCapsuleDetail } from "@/features/capsules/hooks/useCapsuleDetail";
import { useCapsuleRealtime } from "@/features/capsules/hooks/useCapsuleRealtime";
import { useOpenCapsule } from "@/features/capsules/hooks/useOpenCapsule";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

export function CapsuleDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ capsuleId?: string | string[] }>();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const routeCapsuleId = Array.isArray(params.capsuleId) ? params.capsuleId[0] : params.capsuleId;
  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const currentUserId = user?.id ?? null;

  const capsuleDetail = useCapsuleDetail(routeCapsuleId ?? null, currentUserId);
  const openCapsuleMutation = useOpenCapsule(coupleId);

  useCapsuleRealtime(coupleId, routeCapsuleId ?? null, coupleHome.state.status === "paired");

  const handleRetryCoupleHome = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleRetryCapsuleDetail = () => {
    if (!routeCapsuleId || !currentUserId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.capsules.detail(routeCapsuleId, currentUserId),
    });
  };

  const handleOpenCapsule = async () => {
    if (!routeCapsuleId || !currentUserId) {
      return;
    }

    try {
      await openCapsuleMutation.mutateAsync({ capsuleId: routeCapsuleId });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.capsules.detail(routeCapsuleId, currentUserId),
      });
    } catch {
      // Friendly API errors are exposed by the mutation hook.
    }
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading capsule detail..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't open this capsule right now."}
          onRetry={handleRetryCoupleHome}
          title="Couldn't load capsule"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen contentContainerStyle={styles.content}>
        <EmptyState description="Pair first to view memory capsules." title="Capsule unavailable" />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen contentContainerStyle={styles.content}>
        <EmptyState
          actionLabel="View invite"
          description="Capsule details unlock after your partner joins."
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
          title="Capsule detail unavailable"
        />
      </Screen>
    );
  }

  if (!routeCapsuleId) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message="This capsule link looks incomplete. Please open it again from your capsule list."
          title="Capsule not found"
        />
      </Screen>
    );
  }

  if (capsuleDetail.isLoading) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading capsule detail..." />
      </Screen>
    );
  }

  if (capsuleDetail.error || !capsuleDetail.detail) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message={capsuleDetail.friendlyError ?? "We couldn't open this capsule right now."}
          onRetry={handleRetryCapsuleDetail}
          title="Couldn't load capsule"
        />
      </Screen>
    );
  }

  const detail = capsuleDetail.detail;
  const capsule = detail.capsule;
  const isReadyToOpen = detail.unlockState === "ready_to_open" && !capsule.opened_at;
  const isOpened = Boolean(capsule.opened_at);

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Capsule detail</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          A calm space for this memory.
        </AppText>
      </View>

      {isOpened ? (
        <CapsuleOpenedContent
          capsule={capsule}
          content={detail.content}
          isRefreshing={capsuleDetail.isFetching}
          onRetry={handleRetryCapsuleDetail}
        />
      ) : null}

      {!isOpened && isReadyToOpen ? (
        <CapsuleOpenableState
          capsule={capsule}
          errorMessage={openCapsuleMutation.friendlyError}
          isOpening={openCapsuleMutation.isPending}
          onOpenPress={handleOpenCapsule}
        />
      ) : null}

      {!isOpened && !isReadyToOpen && detail.isCreatedByMe ? (
        <CapsulePreviewCard
          capsule={capsule}
          isRefreshing={capsuleDetail.isFetching}
          mediaAssetId={detail.content?.media_asset_id}
          note={detail.content?.note}
          onRetry={handleRetryCapsuleDetail}
        />
      ) : null}

      {!isOpened && !isReadyToOpen && !detail.isCreatedByMe ? (
        <CapsuleLockedState capsule={capsule} />
      ) : null}

      <Button
        onPress={() => {
          router.replace("/(couple)/capsules");
        }}
        title="Back to capsules"
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
});

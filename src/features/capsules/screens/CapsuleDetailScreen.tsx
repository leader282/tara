import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { CapsuleLockedState } from "@/features/capsules/components/CapsuleLockedState";
import { CapsuleOpenableState } from "@/features/capsules/components/CapsuleOpenableState";
import { CapsuleOpenedContent } from "@/features/capsules/components/CapsuleOpenedContent";
import { CapsulePreviewCard } from "@/features/capsules/components/CapsulePreviewCard";
import { useCapsuleDetail } from "@/features/capsules/hooks/useCapsuleDetail";
import { useOpenCapsule } from "@/features/capsules/hooks/useOpenCapsule";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { queryKeys } from "@/lib/query/queryKeys";

export function CapsuleDetailScreen() {
  const router = useRouter();
  const goBack = useGoBack("/(couple)/capsules");
  const queryClient = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<{ capsuleId?: string | string[] }>();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();

  const routeCapsuleId = Array.isArray(params.capsuleId) ? params.capsuleId[0] : params.capsuleId;
  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const coupleId = pairedData?.couple.id ?? null;
  const currentUserId = user?.id ?? null;

  const capsuleDetail = useCapsuleDetail(routeCapsuleId ?? null, currentUserId);
  const openCapsuleMutation = useOpenCapsule(coupleId);

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
      toast.show({
        tone: "success",
        emoji: "💌",
        title: "Capsule opened",
        message: "A little piece of your past, waiting just for you two.",
      });
    } catch {
      // Friendly API errors are exposed by the mutation hook.
    }
  };

  const screenProps = {
    backLabel: "Back to capsules",
    onBack: goBack,
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen centered {...screenProps}>
        <LoadingState label="Loading capsule detail..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered {...screenProps}>
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
      <Screen centered {...screenProps}>
        <EmptyState description="Pair first to view memory capsules." title="Capsule unavailable" />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen centered {...screenProps}>
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
      <Screen centered {...screenProps}>
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
      <Screen centered {...screenProps}>
        <ErrorState
          message="This capsule link looks incomplete. Please open it again from your capsule list."
          title="Capsule not found"
        />
      </Screen>
    );
  }

  if (capsuleDetail.isLoading) {
    return (
      <Screen centered {...screenProps}>
        <LoadingState label="Loading capsule detail..." />
      </Screen>
    );
  }

  if (capsuleDetail.error || !capsuleDetail.detail) {
    return (
      <Screen centered {...screenProps}>
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
    <Screen {...screenProps} scroll subtitle="A calm space for this memory." title="Capsule detail">
      {isOpened ? (
        <CapsuleOpenedContent
          capsule={capsule}
          content={detail.content}
          isRefreshing={capsuleDetail.isFetching}
          media={detail.media}
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
          media={detail.media}
          note={detail.content?.note}
          onRetry={handleRetryCapsuleDetail}
        />
      ) : null}

      {!isOpened && !isReadyToOpen && !detail.isCreatedByMe ? (
        <CapsuleLockedState capsule={capsule} />
      ) : null}
    </Screen>
  );
}

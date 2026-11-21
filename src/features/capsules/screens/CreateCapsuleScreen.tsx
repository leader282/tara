import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
import { EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { DEFAULT_CAPSULE_UNLOCK_TIME } from "@/features/capsules/constants";
import { CapsuleCreateForm } from "@/features/capsules/components/CapsuleCreateForm";
import { useCreateCapsule } from "@/features/capsules/hooks/useCreateCapsule";
import type { CreateCapsuleInput } from "@/features/capsules/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { formatUnlockDateTime, parseDateTimeFromFields } from "@/lib/dates/format";
import { queryKeys } from "@/lib/query/queryKeys";

export function CreateCapsuleScreen() {
  const router = useRouter();
  const goBack = useGoBack("/(couple)/capsules");
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const createCapsuleMutation = useCreateCapsule(pairedData?.couple.id ?? null);

  const handleRetryCoupleHome = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleSubmitCapsule = async (values: CreateCapsuleInput) => {
    if (!pairedData) {
      setSubmitError("Your couple space is still loading. Please try again.");
      return;
    }

    const unlockAtIso = parseDateTimeFromFields(
      values.unlockDate,
      values.unlockTime,
      DEFAULT_CAPSULE_UNLOCK_TIME
    );
    if (!unlockAtIso) {
      setSubmitError("Please enter a valid unlock date and time.");
      return;
    }

    const unlockAt = new Date(unlockAtIso);
    if (Number.isNaN(unlockAt.getTime()) || unlockAt.getTime() <= Date.now()) {
      setSubmitError("Choose an unlock date and time in the future.");
      return;
    }

    try {
      setSubmitError(null);
      const capsule = await createCapsuleMutation.mutateAsync(values);
      toast.show({
        tone: "success",
        emoji: "🎁",
        title: "Capsule sealed",
        message: `It opens ${formatUnlockDateTime(unlockAtIso) ?? "on its day"}. ${
          pairedData.partnerProfile.display_name
        } can see it's waiting.`,
      });
      router.replace({
        pathname: "/(couple)/capsules/[capsuleId]",
        params: { capsuleId: capsule.id },
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
        <LoadingState label="Loading capsule setup..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered {...screenProps}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't open capsule creation right now."}
          onRetry={handleRetryCoupleHome}
          title="Couldn't create capsule"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen centered {...screenProps}>
        <EmptyState
          actionLabel="Open invite setup"
          description="Pair first to create memory capsules."
          onActionPress={() => router.replace("/(invite)")}
          title="Capsules are unavailable"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen centered {...screenProps}>
        <EmptyState
          actionLabel="View invite"
          description="Capsules unlock after your partner joins."
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
          message="Your couple setup needs attention before creating capsules."
          onRetry={handleRetryCoupleHome}
          title="Capsule creation unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen
      {...screenProps}
      scroll
      subtitle="Save something now to open together later. Your partner sees it's waiting, but not what's inside."
      title="Create memory capsule"
    >
      <CapsuleCreateForm
        isSubmitting={createCapsuleMutation.isPending}
        onCancel={goBack}
        onSubmit={handleSubmitCapsule}
        submitError={submitError ?? createCapsuleMutation.friendlyError}
      />
    </Screen>
  );
}

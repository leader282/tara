import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { AppText, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { DEFAULT_CAPSULE_UNLOCK_TIME } from "@/features/capsules/constants";
import { CapsuleCreateForm } from "@/features/capsules/components/CapsuleCreateForm";
import { useCreateCapsule } from "@/features/capsules/hooks/useCreateCapsule";
import type { CreateCapsuleInput } from "@/features/capsules/types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { parseDateTimeFromFields } from "@/lib/dates/format";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

export function CreateCapsuleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
      router.replace({
        pathname: "/(couple)/capsules/[capsuleId]",
        params: { capsuleId: capsule.id },
      });
    } catch {
      // Friendly API errors are exposed by the mutation hook.
    }
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading capsule setup..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
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
      <Screen contentContainerStyle={styles.content}>
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
      <Screen contentContainerStyle={styles.content}>
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
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message="Your couple setup needs attention before creating capsules."
          onRetry={handleRetryCoupleHome}
          title="Capsule creation unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Create memory capsule</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Save a note, photo, or both now and open it together later.
        </AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Your partner can see that a capsule exists, but its content stays private until it unlocks.
        </AppText>
      </View>

      <CapsuleCreateForm
        isSubmitting={createCapsuleMutation.isPending}
        onCancel={() => router.replace("/(couple)/capsules")}
        onSubmit={handleSubmitCapsule}
        submitError={submitError ?? createCapsuleMutation.friendlyError}
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

import { StyleSheet, View } from "react-native";

import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { RitualLockedState } from "@/features/rituals/components/RitualLockedState";
import { RitualPromptCard } from "@/features/rituals/components/RitualPromptCard";
import { RitualResponseForm } from "@/features/rituals/components/RitualResponseForm";
import { RitualRevealedResult } from "@/features/rituals/components/RitualRevealedResult";
import type { TodayRitualState } from "@/features/rituals/types";
import { radii, spacing } from "@/theme/tokens";

type TodayRitualCardProps = {
  state: TodayRitualState;
  partnerDisplayName?: string;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmitResponse?: (params: {
    coupleRitualId: string;
    textResponse?: string | null;
    mediaAssetId?: string | null;
  }) => Promise<void> | void;
  onRetry?: () => void;
};

export function TodayRitualCard({
  state,
  partnerDisplayName = "Partner",
  isSubmitting = false,
  submitError = null,
  onSubmitResponse,
  onRetry,
}: TodayRitualCardProps) {
  if (state.status === "loading") {
    return (
      <View style={styles.container}>
        <Skeleton height={260} radius={radii.xl} />
        <Skeleton height={180} radius={radii.lg} />
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <Card>
        <ErrorState message={state.message} onRetry={onRetry} title="Couldn't load today's ritual" />
      </Card>
    );
  }

  if (state.status === "unavailable") {
    return (
      <Card>
        <EmptyState
          description={state.message ?? "Today's ritual will appear once your couple space is ready."}
          icon="sparkles-outline"
          title="Today's ritual is resting"
        />
      </Card>
    );
  }

  const { ritual } = state;

  return (
    <View style={styles.container}>
      <RitualPromptCard coupleRitual={ritual.coupleRitual} template={ritual.template} />
      <Card>
        {state.status === "not_started" ? (
          <RitualResponseForm
            inputType={ritual.template.input_type}
            isSubmitting={isSubmitting}
            onSubmit={async ({ textResponse, mediaAssetId }) => {
              if (!onSubmitResponse) {
                return;
              }

              await onSubmitResponse({
                coupleRitualId: ritual.coupleRitual.id,
                textResponse,
                mediaAssetId,
              });
            }}
            submitError={submitError}
          />
        ) : null}

        {state.status === "completed_by_me_waiting" ? (
          <RitualLockedState partnerDisplayName={partnerDisplayName} />
        ) : null}

        {state.status === "revealed" ? (
          <RitualRevealedResult
            completedAt={ritual.coupleRitual.updated_at}
            myCompletion={ritual.myCompletion}
            partnerCompletion={ritual.partnerCompletion}
            partnerDisplayName={partnerDisplayName}
          />
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});

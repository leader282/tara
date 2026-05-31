import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { RitualInputTypeNotice } from "@/features/rituals/components/RitualInputTypeNotice";
import { RitualLockedState } from "@/features/rituals/components/RitualLockedState";
import { RitualPromptCard } from "@/features/rituals/components/RitualPromptCard";
import { RitualResponseForm } from "@/features/rituals/components/RitualResponseForm";
import { RitualRevealedResult } from "@/features/rituals/components/RitualRevealedResult";
import type { TodayRitualState } from "@/features/rituals/types";
import { spacing } from "@/theme/tokens";

type TodayRitualCardProps = {
  state: TodayRitualState;
  partnerDisplayName?: string;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmitResponse?: (params: { coupleRitualId: string; textResponse: string }) => Promise<void> | void;
  onRetry?: () => void;
};

function StateCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Card>
      <View style={styles.stateCardContent}>{children}</View>
    </Card>
  );
}

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
      <Card>
        <LoadingState label="Loading today's ritual..." />
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <StateCard>
        <ErrorState message={state.message} onRetry={onRetry} title="Couldn't load today's ritual" />
      </StateCard>
    );
  }

  if (state.status === "unavailable") {
    return (
      <StateCard>
        <EmptyState
          description={state.message ?? "Today's ritual will appear once your couple space is ready."}
          title="Today's ritual is resting"
        />
      </StateCard>
    );
  }

  const { ritual } = state;

  return (
    <View style={styles.container}>
      <RitualPromptCard coupleRitual={ritual.coupleRitual} template={ritual.template} />
      <StateCard>
        {state.status === "unsupported_photo" ? (
          <RitualInputTypeNotice inputType={ritual.template.input_type} />
        ) : null}

        {state.status === "not_started" ? (
          ritual.template.input_type === "photo" ? (
            <RitualInputTypeNotice inputType={ritual.template.input_type} />
          ) : (
            <RitualResponseForm
              inputType={ritual.template.input_type}
              isSubmitting={isSubmitting}
              onSubmit={async (textResponse) => {
                if (!onSubmitResponse) {
                  return;
                }

                await onSubmitResponse({
                  coupleRitualId: ritual.coupleRitual.id,
                  textResponse,
                });
              }}
              submitError={submitError}
            />
          )
        ) : null}

        {state.status === "completed_by_me_waiting" ? <RitualLockedState /> : null}

        {state.status === "revealed" ? (
          <RitualRevealedResult
            completedAt={ritual.coupleRitual.updated_at}
            myCompletion={ritual.myCompletion}
            partnerCompletion={ritual.partnerCompletion}
            partnerDisplayName={partnerDisplayName}
          />
        ) : null}
      </StateCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  stateCardContent: {
    gap: spacing.md,
  },
});

import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";
import { useCompleteOnboarding } from "@/features/onboarding/hooks/useCompleteOnboarding";
import { spacing } from "@/theme/tokens";

const TOTAL_STEPS = 4;

function toFriendlySubmitError(): string {
  return "We couldn't finish onboarding right now. Please try again.";
}

export function OnboardingCompleteScreen() {
  const router = useRouter();
  const completeOnboardingMutation = useCompleteOnboarding();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleComplete = async () => {
    try {
      setSubmitError(null);
      await completeOnboardingMutation.mutateAsync();
      router.replace("/(protected)");
    } catch {
      setSubmitError(toFriendlySubmitError());
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <OnboardingProgress currentStep={4} title="Complete" totalSteps={TOTAL_STEPS} />

      <View style={styles.header}>
        <AppText variant="title">You&apos;re all set for now</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Your profile and preferences are saved. Couple setup comes next.
        </AppText>
      </View>

      <Card>
        <View style={styles.summary}>
          <AppText variant="subtitle">What&apos;s ready</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            - Your display profile basics
          </AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            - Your emotional tone preferences
          </AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            - Your quiet-hours defaults
          </AppText>
        </View>
      </Card>

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      <Button
        loading={completeOnboardingMutation.isPending}
        onPress={handleComplete}
        title="Continue to Tara"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
  summary: {
    gap: spacing.sm,
  },
});

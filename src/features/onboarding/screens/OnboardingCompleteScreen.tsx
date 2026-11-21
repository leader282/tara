import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Icon, InlineMessage, Screen } from "@/components/ui";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";
import { ONBOARDING_TOTAL_STEPS } from "@/features/onboarding/components/OnboardingHeader";
import { useCompleteOnboarding } from "@/features/onboarding/hooks/useCompleteOnboarding";
import { colors, radii, spacing } from "@/theme/tokens";

const READY_ITEMS = [
  "Your display profile basics",
  "Your emotional tone preferences",
  "Your quiet-hours defaults",
];

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
      router.replace("/");
    } catch {
      setSubmitError(toFriendlySubmitError());
    }
  };

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <OnboardingProgress currentStep={4} title="Complete" totalSteps={ONBOARDING_TOTAL_STEPS} />

      <View style={styles.hero}>
        <View style={styles.emojiWell}>
          <AppText style={styles.emoji}>🎉</AppText>
        </View>
        <AppText accessibilityRole="header" align="center" variant="title">
          You&apos;re all set for now
        </AppText>
        <AppText align="center" color="textSecondary" variant="bodyMuted">
          Your profile and preferences are saved. Couple setup comes next.
        </AppText>
      </View>

      <Card>
        <View style={styles.summary}>
          <AppText color="textSecondary" variant="overline">
            What&apos;s ready
          </AppText>
          {READY_ITEMS.map((item) => (
            <View key={item} style={styles.summaryRow}>
              <View style={styles.check}>
                <Icon color="success" name="checkmark" size={14} />
              </View>
              <AppText style={styles.summaryText} variant="body">
                {item}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <Button
        iconRight="arrow-forward"
        loading={completeOnboardingMutation.isPending}
        onPress={handleComplete}
        title="Continue to Tara"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  emojiWell: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  emoji: {
    fontSize: 42,
    lineHeight: 50,
  },
  summary: {
    gap: spacing.md,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  check: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  summaryText: {
    flex: 1,
  },
});

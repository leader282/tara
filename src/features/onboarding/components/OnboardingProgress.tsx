import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
  title: string;
};

export function OnboardingProgress({ currentStep, totalSteps, title }: OnboardingProgressProps) {
  return (
    <View
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}: ${title}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }}
      style={styles.container}
    >
      <View style={styles.metaRow}>
        <AppText color="primary" variant="overline">
          Step {currentStep} of {totalSteps}
        </AppText>
        <AppText color="textSecondary" variant="caption">
          {title}
        </AppText>
      </View>

      <View style={styles.progressTrack}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={`onboarding-step-${index + 1}`}
            style={[styles.progressSegment, index < currentStep ? styles.progressSegmentActive : null]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTrack: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  progressSegment: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    flex: 1,
    height: 5,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
});

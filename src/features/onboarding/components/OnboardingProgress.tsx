import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
  title: string;
};

export function OnboardingProgress({
  currentStep,
  totalSteps,
  title,
}: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.metaRow}>
        <AppText color="textSecondary" variant="caption">
          Step {currentStep} of {totalSteps}
        </AppText>
        <AppText color="textSecondary" variant="caption">
          {title}
        </AppText>
      </View>

      <View style={styles.progressTrack}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const isActive = index < currentStep;
          return (
            <View
              key={`onboarding-step-${index + 1}`}
              style={[styles.progressSegment, isActive ? styles.progressSegmentActive : null]}
            />
          );
        })}
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
    gap: spacing.sm,
  },
  progressSegment: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    flex: 1,
    height: 6,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
});

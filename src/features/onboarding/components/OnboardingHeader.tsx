import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";
import { spacing } from "@/theme/tokens";

export const ONBOARDING_TOTAL_STEPS = 4;

type OnboardingHeaderProps = {
  step: number;
  stepTitle: string;
  title: string;
  subtitle: string;
};

export function OnboardingHeader({ step, stepTitle, title, subtitle }: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={step} title={stepTitle} totalSteps={ONBOARDING_TOTAL_STEPS} />
      <View style={styles.copy}>
        <AppText accessibilityRole="header" variant="title">
          {title}
        </AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  copy: {
    gap: spacing.sm,
  },
});

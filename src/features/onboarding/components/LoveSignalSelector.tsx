import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { LOVE_SIGNALS, type LoveSignal } from "@/features/onboarding/types";
import { spacing } from "@/theme/tokens";

type LoveSignalSelectorProps = {
  selectedValues: LoveSignal[];
  onChange: (nextValues: LoveSignal[]) => void;
  errorMessage?: string;
};

const labelBySignal: Record<LoveSignal, { label: string; description: string }> = {
  thinking_of_you: {
    label: "Thinking-of-you nudges",
    description: "Little check-ins that say “you’re on my mind.”",
  },
  good_morning_good_night: {
    label: "Good morning / good night",
    description: "Warm beginnings and softer endings to the day.",
  },
  shared_photos: {
    label: "Shared photos",
    description: "Tiny glimpses of everyday life together.",
  },
  tiny_notes: {
    label: "Tiny notes",
    description: "Short messages of care without pressure to reply fast.",
  },
  rituals: {
    label: "Gentle rituals",
    description: "Simple routines that feel grounding, never guilt-heavy.",
  },
  countdowns: {
    label: "Countdown moments",
    description: "Shared anticipation for the next reunion.",
  },
  memory_capsules: {
    label: "Memory capsules",
    description: "Save meaningful moments for later with intention.",
  },
};

export function LoveSignalSelector({
  selectedValues,
  onChange,
  errorMessage,
}: LoveSignalSelectorProps) {
  const selectedSet = new Set(selectedValues);

  return (
    <View style={styles.container}>
      {LOVE_SIGNALS.map((signal) => {
        const signalMeta = labelBySignal[signal];
        const isSelected = selectedSet.has(signal);

        return (
          <OnboardingOptionCard
            key={signal}
            accessibilityLabel={signalMeta.label}
            description={signalMeta.description}
            label={signalMeta.label}
            onPress={() => {
              if (isSelected) {
                onChange(selectedValues.filter((value) => value !== signal));
                return;
              }

              onChange([...selectedValues, signal]);
            }}
            selected={isSelected}
          />
        );
      })}

      {errorMessage ? (
        <AppText color="danger" variant="caption">
          {errorMessage}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});

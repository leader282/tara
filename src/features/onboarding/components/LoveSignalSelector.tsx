import { StyleSheet, View } from "react-native";

import { InlineMessage } from "@/components/ui";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { LOVE_SIGNALS, type LoveSignal } from "@/features/onboarding/types";
import { spacing } from "@/theme/tokens";

type LoveSignalSelectorProps = {
  selectedValues: LoveSignal[];
  onChange: (nextValues: LoveSignal[]) => void;
  errorMessage?: string;
};

const labelBySignal: Record<LoveSignal, { label: string; description: string; emoji: string }> = {
  thinking_of_you: {
    label: "Thinking-of-you nudges",
    description: "Little check-ins that say “you’re on my mind.”",
    emoji: "💭",
  },
  good_morning_good_night: {
    label: "Good morning / good night",
    description: "Warm beginnings and softer endings to the day.",
    emoji: "🌅",
  },
  shared_photos: {
    label: "Shared photos",
    description: "Tiny glimpses of everyday life together.",
    emoji: "📷",
  },
  tiny_notes: {
    label: "Tiny notes",
    description: "Short messages of care without pressure to reply fast.",
    emoji: "💌",
  },
  rituals: {
    label: "Gentle rituals",
    description: "Simple routines that feel grounding, never guilt-heavy.",
    emoji: "✨",
  },
  countdowns: {
    label: "Countdown moments",
    description: "Shared anticipation for the next reunion.",
    emoji: "⏳",
  },
  memory_capsules: {
    label: "Memory capsules",
    description: "Save meaningful moments for later with intention.",
    emoji: "🎁",
  },
};

export function LoveSignalSelector({ selectedValues, onChange, errorMessage }: LoveSignalSelectorProps) {
  const selectedSet = new Set(selectedValues);

  return (
    <View style={styles.container}>
      {LOVE_SIGNALS.map((signal) => {
        const signalMeta = labelBySignal[signal];
        const isSelected = selectedSet.has(signal);

        return (
          <OnboardingOptionCard
            accessibilityLabel={signalMeta.label}
            description={signalMeta.description}
            emoji={signalMeta.emoji}
            indicator="check"
            key={signal}
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

      {errorMessage ? <InlineMessage message={errorMessage} tone="danger" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});

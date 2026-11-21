import { OptionCard } from "@/components/ui";

type OnboardingOptionCardProps = {
  label: string;
  description?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  indicator?: "radio" | "check";
  accessibilityLabel?: string;
};

export function OnboardingOptionCard({
  label,
  description,
  emoji,
  selected,
  onPress,
  indicator = "radio",
  accessibilityLabel,
}: OnboardingOptionCardProps) {
  return (
    <OptionCard
      accessibilityLabel={accessibilityLabel}
      description={description}
      emoji={emoji}
      indicator={indicator}
      label={label}
      onPress={onPress}
      selected={selected}
    />
  );
}

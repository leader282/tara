import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import type { PresencePulseType } from "@/features/presence/types";
import { radii } from "@/theme/tokens";

type PulseTypeIconProps = {
  type: PresencePulseType;
  size?: number;
  surface?: boolean;
};

export function PulseTypeIcon({ type, size = 40, surface = false }: PulseTypeIconProps) {
  const option = PRESENCE_PULSE_OPTIONS[type];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        {
          backgroundColor: surface ? "#FFFFFF" : option.tint,
          height: size,
          width: size,
        },
      ]}
    >
      <AppText
        maxFontSizeMultiplier={1}
        style={{ fontSize: Math.round(size * 0.5), lineHeight: Math.round(size * 0.64) }}
      >
        {option.emoji}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: radii.pill,
    justifyContent: "center",
  },
});

import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import type { PresencePulseType } from "@/features/presence/types";
import { colors, radii, spacing } from "@/theme/tokens";

type PulseTypeIconProps = {
  type: PresencePulseType;
  compact?: boolean;
};

function formatIconText(type: PresencePulseType): string {
  const rawIcon = PRESENCE_PULSE_OPTIONS[type].iconText ?? "pulse";
  return rawIcon.length <= 4 ? rawIcon.toUpperCase() : rawIcon.slice(0, 4).toUpperCase();
}

export function PulseTypeIcon({ type, compact = false }: PulseTypeIconProps) {
  return (
    <View style={[styles.container, compact ? styles.containerCompact : null]}>
      <AppText color="primary" variant="caption">
        {formatIconText(type)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 24,
    minWidth: 44,
    paddingHorizontal: spacing.sm,
  },
  containerCompact: {
    minHeight: 20,
    minWidth: 36,
    paddingHorizontal: spacing.xs,
  },
});

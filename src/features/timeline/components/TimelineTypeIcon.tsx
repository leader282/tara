import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type TimelineTypeIconProps = {
  iconText: string;
  typeLabel: string;
};

function toCompactIcon(iconText: string): string {
  const normalized = iconText.trim().toUpperCase();
  if (normalized.length <= 6) {
    return normalized;
  }

  return normalized.slice(0, 6);
}

export function TimelineTypeIcon({ iconText, typeLabel }: TimelineTypeIconProps) {
  return (
    <View accessibilityLabel={typeLabel} style={styles.container}>
      <AppText color="primary" variant="caption">
        {toCompactIcon(iconText)}
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
    minHeight: 26,
    minWidth: 56,
    paddingHorizontal: spacing.sm,
  },
});

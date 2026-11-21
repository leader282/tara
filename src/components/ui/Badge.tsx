import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radii, spacing, type ColorName } from "@/theme/tokens";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "inverse";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

const toneStyles: Record<BadgeTone, { background: string; text: ColorName }> = {
  neutral: { background: colors.surfaceMuted, text: "textSecondary" },
  primary: { background: colors.primarySoft, text: "primaryStrong" },
  success: { background: colors.successSoft, text: "success" },
  warning: { background: colors.warningSoft, text: "warning" },
  danger: { background: colors.dangerSoft, text: "danger" },
  info: { background: colors.infoSoft, text: "info" },
  inverse: { background: "rgba(255, 255, 255, 0.16)", text: "inkText" },
};

export function Badge({ label, tone = "neutral", icon, style }: BadgeProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.background }, style]}>
      {icon ? <Icon color={toneStyle.text} name={icon} size={13} /> : null}
      <AppText color={toneStyle.text} numberOfLines={1} style={styles.label} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radii, spacing, type ColorName } from "@/theme/tokens";

export type InlineMessageTone = "info" | "success" | "warning" | "danger" | "neutral";

type InlineMessageProps = {
  message: string;
  title?: string;
  tone?: InlineMessageTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

const toneStyles: Record<
  InlineMessageTone,
  { background: string; border: string; text: ColorName; icon: IconName }
> = {
  info: {
    background: colors.infoSoft,
    border: "#D3E0F2",
    text: "info",
    icon: "information-circle",
  },
  success: {
    background: colors.successSoft,
    border: "#CBE6D7",
    text: "success",
    icon: "checkmark-circle",
  },
  warning: {
    background: colors.warningSoft,
    border: "#F2DFB8",
    text: "warning",
    icon: "alert-circle",
  },
  danger: {
    background: colors.dangerSoft,
    border: "#F4CFCA",
    text: "danger",
    icon: "alert-circle",
  },
  neutral: {
    background: colors.surfaceMuted,
    border: colors.border,
    text: "textSecondary",
    icon: "information-circle",
  },
};

export function InlineMessage({ message, title, tone = "info", icon, style }: InlineMessageProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View
      accessibilityLiveRegion={tone === "danger" ? "assertive" : "polite"}
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      style={[
        styles.container,
        { backgroundColor: toneStyle.background, borderColor: toneStyle.border },
        style,
      ]}
    >
      <Icon color={toneStyle.text} name={icon ?? toneStyle.icon} size={18} style={styles.icon} />
      <View style={styles.copy}>
        {title ? (
          <AppText color={toneStyle.text} variant="label">
            {title}
          </AppText>
        ) : null}
        <AppText color={tone === "neutral" ? "textSecondary" : "textPrimary"} variant="bodyMuted">
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: {
    marginTop: 2,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

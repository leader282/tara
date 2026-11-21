import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, radii } from "@/theme/tokens";
import { fontFamilies } from "@/theme/typography";

type AvatarTone = "primary" | "ink" | "light";

type AvatarProps = {
  name: string;
  size?: number;
  tone?: AvatarTone;
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
};

const toneStyles: Record<AvatarTone, { background: string; text: string }> = {
  primary: { background: colors.primarySoft, text: colors.primaryStrong },
  ink: { background: colors.ink, text: colors.inkText },
  light: { background: "rgba(255, 255, 255, 0.9)", text: colors.ink },
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function Avatar({ name, size = 44, tone = "primary", ring = false, style }: AvatarProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.avatar,
        {
          backgroundColor: toneStyle.background,
          height: size,
          width: size,
        },
        ring ? styles.ring : null,
        style,
      ]}
    >
      <AppText
        maxFontSizeMultiplier={1}
        style={{
          color: toneStyle.text,
          fontFamily: fontFamilies.semibold,
          fontSize: Math.round(size * 0.38),
          lineHeight: Math.round(size * 0.46),
        }}
      >
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: radii.pill,
    justifyContent: "center",
  },
  ring: {
    borderColor: colors.surface,
    borderWidth: 2,
  },
});

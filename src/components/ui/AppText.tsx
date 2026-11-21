import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { colors, type ColorName } from "@/theme/tokens";
import { textVariants, type TextVariant } from "@/theme/typography";

export type AppTextColor = ColorName;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: AppTextColor;
  align?: TextStyle["textAlign"];
};

const DISPLAY_VARIANTS = new Set<TextVariant>(["display", "title", "headline"]);

export function AppText({
  variant = "body",
  color = "textPrimary",
  align,
  maxFontSizeMultiplier,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (DISPLAY_VARIANTS.has(variant) ? 1.3 : 1.5)}
      {...props}
      style={[
        styles.base,
        textVariants[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});

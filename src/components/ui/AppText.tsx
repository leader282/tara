import { Text, type TextProps, type TextStyle } from "react-native";

import { colors } from "@/theme/tokens";
import { textVariants, type TextVariant } from "@/theme/typography";

export type AppTextColor = keyof typeof colors;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: AppTextColor;
};

const variantStyles: Record<TextVariant, TextStyle> = {
  title: textVariants.title,
  subtitle: textVariants.subtitle,
  body: textVariants.body,
  bodyMuted: textVariants.bodyMuted,
  caption: textVariants.caption,
};

export function AppText({
  variant = "body",
  color = "textPrimary",
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        variantStyles[variant],
        {
          color: colors[color],
        },
        style,
      ]}
    />
  );
}

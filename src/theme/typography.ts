import type { TextStyle } from "react-native";

export const fontFamilies = {
  display: "Fraunces_600SemiBold",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
} as const;

export const textVariants = {
  display: {
    fontFamily: fontFamilies.display,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  headline: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMuted: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 19,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  overline: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;

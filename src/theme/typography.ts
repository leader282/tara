export const fontFamilies = {
  regular: "System",
  medium: "System",
  semibold: "System",
} as const;

export const textVariants = {
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamilies.semibold,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 27,
    fontFamily: fontFamilies.medium,
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.regular,
    letterSpacing: 0.1,
  },
  bodyMuted: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamilies.regular,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.medium,
    letterSpacing: 0.2,
  },
} as const;

export type TextVariant = keyof typeof textVariants;

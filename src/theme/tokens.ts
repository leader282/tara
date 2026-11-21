export const colors = {
  background: "#FAF6F3",
  surface: "#FFFFFF",
  surfaceMuted: "#F4EDE8",
  border: "#ECE3DD",
  borderStrong: "#DACDC5",
  textPrimary: "#231A16",
  textSecondary: "#6F6059",
  textTertiary: "#A1928A",
  textInverse: "#FFFFFF",
  primary: "#B8524A",
  primaryPressed: "#9C443E",
  primarySoft: "#F8E8E4",
  primaryStrong: "#8E3C36",
  secondary: "#F2E9E4",
  secondaryPressed: "#E7DAD3",
  danger: "#C2362F",
  dangerPressed: "#A32D27",
  dangerSoft: "#FBEAE8",
  success: "#2E7D57",
  successSoft: "#E3F2EA",
  warning: "#9A6213",
  warningSoft: "#FBF0DC",
  info: "#3A67A8",
  infoSoft: "#E7EEF8",
  ink: "#3B2A45",
  inkText: "#FFF8F5",
  inkMuted: "#E6D6DF",
  gold: "#F4CD84",
  overlay: "rgba(28, 19, 16, 0.42)",
} as const;

export type ColorName = keyof typeof colors;

export const gradients = {
  hero: "linear-gradient(145deg, #2E2440 0%, #5A3452 55%, #A5565A 100%)",
  brand: "linear-gradient(145deg, #C7655A 0%, #B8524A 45%, #8E3C50 100%)",
  dawn: "linear-gradient(160deg, #FFF3EC 0%, #FBE3DC 100%)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 56,
} as const;

export const layout = {
  gutter: 20,
  maxContentWidth: 560,
  minTouchTarget: 44,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadows = {
  card: {
    boxShadow: "0px 1px 2px rgba(51, 30, 22, 0.05), 0px 8px 24px rgba(51, 30, 22, 0.06)",
  },
  raised: {
    boxShadow: "0px 2px 6px rgba(51, 30, 22, 0.08), 0px 18px 40px rgba(51, 30, 22, 0.16)",
  },
  primary: {
    boxShadow: "0px 6px 16px rgba(184, 82, 74, 0.28)",
  },
} as const;

export const motion = {
  fast: 140,
  normal: 220,
  slow: 320,
} as const;

export const tokens = {
  colors,
  gradients,
  spacing,
  layout,
  radii,
  shadows,
  motion,
} as const;

export type AppTokens = typeof tokens;

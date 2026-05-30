export const colors = {
  background: "#FFF8F4",
  surface: "#FFFFFF",
  surfaceMuted: "#F8EFE9",
  border: "#E8D7CC",
  textPrimary: "#2C1F1A",
  textSecondary: "#5F4A42",
  textInverse: "#FFFDFB",
  primary: "#A46245",
  primaryPressed: "#8C533A",
  secondary: "#F3E3D9",
  secondaryPressed: "#EAD3C5",
  danger: "#C34A3A",
  success: "#2F7D57",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;

export const tokens = {
  colors,
  spacing,
  radii,
  shadows,
} as const;

export type AppTokens = typeof tokens;

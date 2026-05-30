import { spacing as spacingScale } from "@/theme/tokens";

export const space = spacingScale;

export const getSpacing = (size: keyof typeof spacingScale): number =>
  spacingScale[size];

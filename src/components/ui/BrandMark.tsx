import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, gradients, shadows } from "@/theme/tokens";

import brandMarkSource from "../../../assets/brand-mark.png";

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function BrandMark({ size = 56, style }: BrandMarkProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        { borderRadius: size * 0.28, height: size, width: size },
        style,
      ]}
    >
      <Image source={brandMarkSource} style={{ height: size * 0.86, width: size * 0.86 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    backgroundColor: colors.primary,
    experimental_backgroundImage: gradients.brand,
    justifyContent: "center",
    ...shadows.primary,
  },
});

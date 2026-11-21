import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, radii, spacing } from "@/theme/tokens";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.container}>
      <View style={styles.spinnerWell}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
      <AppText align="center" color="textSecondary" variant="bodyMuted">
        {label}
      </AppText>
    </View>
  );
}

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = "100%", height = 16, radius = radii.sm, style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { borderRadius: radius, height, opacity, width },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  spinnerWell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  skeleton: {
    backgroundColor: colors.surfaceMuted,
  },
});

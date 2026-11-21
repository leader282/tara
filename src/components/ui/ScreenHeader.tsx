import { type ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { colors, layout, spacing } from "@/theme/tokens";

type ScreenHeaderProps = {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  titleOpacity?: Animated.AnimatedInterpolation<number> | number;
  dividerOpacity?: Animated.AnimatedInterpolation<number> | number;
};

export function ScreenHeader({
  title,
  onBack,
  backLabel = "Back",
  right,
  titleOpacity = 1,
  dividerOpacity = 0,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton
            accessibilityLabel={backLabel}
            icon="chevron-back"
            iconSize={24}
            onPress={onBack}
            variant="plain"
          />
        ) : null}
      </View>

      <Animated.View pointerEvents="none" style={[styles.titleContainer, { opacity: titleOpacity }]}>
        {title ? (
          <AppText numberOfLines={1} variant="subtitle">
            {title}
          </AppText>
        ) : null}
      </Animated.View>

      <View style={[styles.side, styles.sideRight]}>{right}</View>

      <Animated.View pointerEvents="none" style={[styles.divider, { opacity: dividerOpacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: layout.gutter - 10,
  },
  side: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 44,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  divider: {
    backgroundColor: colors.border,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: "absolute",
    right: 0,
  },
});

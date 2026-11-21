import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { spacing } from "@/theme/tokens";

type SectionHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({
  title,
  description,
  actionLabel,
  onActionPress,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <AppText accessibilityRole="header" style={styles.title} variant="subtitle">
          {title}
        </AppText>
        {actionLabel && onActionPress ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onActionPress}
            style={({ pressed }) => [pressed ? styles.actionPressed : null]}
          >
            <AppText color="primary" variant="label">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {description ? (
        <AppText color="textSecondary" variant="bodyMuted">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  actionPressed: {
    opacity: 0.6,
  },
});

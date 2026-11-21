import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radii, spacing } from "@/theme/tokens";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionVariant?: ButtonVariant;
  icon?: IconName;
  emoji?: string;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
  actionVariant = "primary",
  icon = "sparkles-outline",
  emoji,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact ? styles.containerCompact : null]}>
      <View style={[styles.iconWell, compact ? styles.iconWellCompact : null]}>
        {emoji ? (
          <AppText style={compact ? styles.emojiCompact : styles.emoji}>{emoji}</AppText>
        ) : (
          <Icon color="primary" name={icon} size={compact ? 22 : 28} />
        )}
      </View>
      <View style={styles.copy}>
        <AppText align="center" variant="subtitle">
          {title}
        </AppText>
        {description ? (
          <AppText align="center" color="textSecondary" variant="bodyMuted">
            {description}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onActionPress ? (
        <Button
          onPress={onActionPress}
          size="md"
          style={styles.action}
          title={actionLabel}
          variant={actionVariant}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  containerCompact: {
    paddingVertical: spacing.lg,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  iconWellCompact: {
    height: 48,
    width: 48,
  },
  emoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  emojiCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  copy: {
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.xs,
    minWidth: 180,
  },
});

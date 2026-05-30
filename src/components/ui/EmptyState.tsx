import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { spacing } from "@/theme/tokens";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <AppText variant="subtitle">{title}</AppText>
      {description ? (
        <AppText color="textSecondary" variant="bodyMuted">
          {description}
        </AppText>
      ) : null}
      {actionLabel && onActionPress ? (
        <View style={styles.action}>
          <Button onPress={onActionPress} title={actionLabel} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 160,
  },
});

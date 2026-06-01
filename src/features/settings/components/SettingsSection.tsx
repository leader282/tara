import { type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type SettingsSectionProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="subtitle">{title}</AppText>
          {description ? (
            <AppText color="textSecondary" variant="bodyMuted">
              {description}
            </AppText>
          ) : null}
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  content: {
    gap: spacing.sm,
  },
});

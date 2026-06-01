import { type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { colors, spacing } from "@/theme/tokens";

type SettingsDangerZoneProps = PropsWithChildren<{
  title?: string;
  description?: string;
}>;

export function SettingsDangerZone({
  title = "Sensitive actions",
  description,
  children,
}: SettingsDangerZoneProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText color="danger" variant="subtitle">
            {title}
          </AppText>
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
    borderColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  content: {
    gap: spacing.sm,
  },
});

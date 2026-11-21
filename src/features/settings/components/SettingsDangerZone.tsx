import { type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon, type IconName } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type SettingsDangerZoneProps = PropsWithChildren<{
  title?: string;
  description?: string;
  icon?: IconName;
}>;

export function SettingsDangerZone({
  title = "Sensitive actions",
  description,
  icon = "warning-outline",
  children,
}: SettingsDangerZoneProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWell}>
            <Icon color="danger" name={icon} size={20} />
          </View>
          <View style={styles.headerCopy}>
            <AppText color="danger" variant="subtitle">
              {title}
            </AppText>
            {description ? (
              <AppText color="textSecondary" variant="bodyMuted">
                {description}
              </AppText>
            ) : null}
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "#F2D3CE",
  },
  container: {
    gap: spacing.lg,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  content: {
    gap: spacing.md,
  },
});

import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type AccountRequestStatusCardProps = {
  title: string;
  statusLabel: string;
  description?: string;
  details?: string[];
};

export function AccountRequestStatusCard({
  title,
  statusLabel,
  description,
  details = [],
}: AccountRequestStatusCardProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="subtitle">{title}</AppText>
          <AppText color="textSecondary" variant="caption">
            {statusLabel}
          </AppText>
        </View>

        {description ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {description}
          </AppText>
        ) : null}

        {details.length > 0 ? (
          <View style={styles.details}>
            {details.map((detail) => (
              <AppText key={detail} color="textSecondary" variant="caption">
                {detail}
              </AppText>
            ))}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  details: {
    gap: spacing.xs,
  },
});

import { StyleSheet, View } from "react-native";

import { AppText, Badge, type BadgeTone, Card, Divider } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type AccountRequestStatusCardProps = {
  title: string;
  statusLabel: string;
  statusTone?: BadgeTone;
  description?: string;
  details?: string[];
};

export function AccountRequestStatusCard({
  title,
  statusLabel,
  statusTone = "neutral",
  description,
  details = [],
}: AccountRequestStatusCardProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText style={styles.title} variant="subtitle">
            {title}
          </AppText>
          <Badge label={statusLabel} tone={statusTone} />
        </View>

        {description ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {description}
          </AppText>
        ) : null}

        {details.length > 0 ? (
          <>
            <Divider />
            <View style={styles.details}>
              {details.map((detail) => (
                <AppText color="textSecondary" key={detail} variant="caption">
                  {detail}
                </AppText>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  details: {
    gap: spacing.xs,
  },
});

import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon, type IconName } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type PrivacyExplanationCardProps = {
  title: string;
  points: string[];
  icon?: IconName;
};

export function PrivacyExplanationCard({
  title,
  points,
  icon = "shield-checkmark-outline",
}: PrivacyExplanationCardProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWell}>
            <Icon color="success" name={icon} size={20} />
          </View>
          <AppText style={styles.title} variant="subtitle">
            {title}
          </AppText>
        </View>
        <View style={styles.points}>
          {points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <Icon color="success" name="checkmark-circle" size={18} style={styles.pointIcon} />
              <AppText color="textSecondary" style={styles.pointText} variant="bodyMuted">
                {point}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  title: {
    flex: 1,
  },
  points: {
    gap: spacing.md,
  },
  pointRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pointIcon: {
    marginTop: 2,
  },
  pointText: {
    flex: 1,
  },
});

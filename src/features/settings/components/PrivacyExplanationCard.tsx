import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type PrivacyExplanationCardProps = {
  title: string;
  points: string[];
};

export function PrivacyExplanationCard({ title, points }: PrivacyExplanationCardProps) {
  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="subtitle">{title}</AppText>
        <View style={styles.points}>
          {points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <AppText color="textSecondary" variant="bodyMuted">
                -
              </AppText>
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
    gap: spacing.md,
  },
  points: {
    gap: spacing.sm,
  },
  pointRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pointText: {
    flex: 1,
  },
});

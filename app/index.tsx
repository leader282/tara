import { StyleSheet, View } from "react-native";

import { AppText, Card, Screen } from "@/components/ui";
import { colors, spacing } from "@/theme/tokens";

export default function HomeScreen() {
  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title">Tara</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Built quietly for long-distance love.
        </AppText>
      </View>

      <Card>
        <View style={styles.cardContent}>
          <AppText variant="subtitle">Private by design</AppText>
          <AppText color="textSecondary" variant="body">
            Tara is a private space for two partners.
          </AppText>
          <AppText color="textSecondary" variant="body">
            It helps long-distance couples feel together while apart.
          </AppText>
        </View>
      </Card>

      <AppText color="textSecondary" style={styles.footer} variant="caption">
        Phase 1 foundation is ready for feature phases.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
  cardContent: {
    gap: spacing.md,
  },
  footer: {
    color: colors.textSecondary,
  },
});

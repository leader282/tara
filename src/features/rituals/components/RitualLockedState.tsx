import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

export function RitualLockedState() {
  return (
    <View style={styles.container}>
      <AppText variant="body">
        Your answer is saved. You&apos;ll see both answers when you&apos;ve both completed this.
      </AppText>
      <AppText color="textSecondary" variant="bodyMuted">
        No pressure. Come back whenever you want.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
});

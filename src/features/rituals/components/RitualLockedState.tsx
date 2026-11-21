import { StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type RitualLockedStateProps = {
  partnerDisplayName?: string;
};

export function RitualLockedState({ partnerDisplayName = "your partner" }: RitualLockedStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWell}>
        <Icon color="success" name="lock-closed" size={22} />
      </View>
      <View style={styles.copy}>
        <AppText variant="subtitle">Your answer is saved.</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          You&apos;ll see both answers when you&apos;ve both completed this.
        </AppText>
        <AppText color="textTertiary" variant="caption">
          Waiting on {partnerDisplayName}. No pressure, come back whenever you want.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});

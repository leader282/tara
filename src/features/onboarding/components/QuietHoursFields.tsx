import { StyleSheet, Switch, View } from "react-native";

import { AppText, TextField } from "@/components/ui";
import { colors, spacing } from "@/theme/tokens";

type QuietHoursFieldsProps = {
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  onChangeEnabled: (enabled: boolean) => void;
  onChangeQuietHoursStart: (value: string) => void;
  onChangeQuietHoursEnd: (value: string) => void;
  quietHoursStartError?: string;
  quietHoursEndError?: string;
};

export function QuietHoursFields({
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  onChangeEnabled,
  onChangeQuietHoursStart,
  onChangeQuietHoursEnd,
  quietHoursStartError,
  quietHoursEndError,
}: QuietHoursFieldsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <AppText variant="body">Enable quiet hours</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Tara should respect your rest.
          </AppText>
        </View>
        <Switch
          accessibilityLabel="Enable quiet hours"
          onValueChange={onChangeEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          value={quietHoursEnabled}
        />
      </View>

      {quietHoursEnabled ? (
        <View style={styles.timeFields}>
          <TextField
            accessibilityLabel="Quiet hours start time"
            autoCapitalize="none"
            autoCorrect={false}
            errorMessage={quietHoursStartError}
            keyboardType="numbers-and-punctuation"
            label="Quiet hours start"
            onChangeText={onChangeQuietHoursStart}
            placeholder="22:00"
            value={quietHoursStart}
          />
          <TextField
            accessibilityLabel="Quiet hours end time"
            autoCapitalize="none"
            autoCorrect={false}
            errorMessage={quietHoursEndError}
            keyboardType="numbers-and-punctuation"
            label="Quiet hours end"
            onChangeText={onChangeQuietHoursEnd}
            placeholder="07:00"
            value={quietHoursEnd}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  switchCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  timeFields: {
    gap: spacing.md,
  },
});

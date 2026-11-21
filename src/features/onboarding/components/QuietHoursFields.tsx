import { StyleSheet, View } from "react-native";

import { SwitchRow, TimeField } from "@/components/ui";
import { spacing } from "@/theme/tokens";

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
        <SwitchRow
          accessibilityLabel="Enable quiet hours"
          description="Tara should respect your rest."
          icon="moon-outline"
          iconTone="info"
          onValueChange={onChangeEnabled}
          title="Enable quiet hours"
          value={quietHoursEnabled}
        />
      </View>

      {quietHoursEnabled ? (
        <View style={styles.timeFields}>
          <TimeField
            accessibilityLabel="Quiet hours start time"
            defaultTime="22:00"
            errorMessage={quietHoursStartError}
            label="Quiet hours start"
            onChange={onChangeQuietHoursStart}
            placeholder="Choose when rest begins"
            sheetTitle="Quiet hours start"
            value={quietHoursStart}
          />
          <TimeField
            accessibilityLabel="Quiet hours end time"
            defaultTime="07:00"
            errorMessage={quietHoursEndError}
            label="Quiet hours end"
            onChange={onChangeQuietHoursEnd}
            placeholder="Choose when rest ends"
            sheetTitle="Quiet hours end"
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
    marginHorizontal: -spacing.lg,
    marginVertical: -spacing.md,
  },
  timeFields: {
    gap: spacing.lg,
  },
});

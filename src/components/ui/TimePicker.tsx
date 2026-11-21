import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatTimeKey, parseTimeKey, toTimeKey } from "@/lib/dates/calendar";
import { colors, radii, spacing } from "@/theme/tokens";

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const PERIOD_OPTIONS = [
  { label: "AM", value: "am" },
  { label: "PM", value: "pm" },
] as const;

type TimePickerProps = {
  value: string;
  onChange: (timeKey: string) => void;
};

export function TimePicker({ value, onChange }: TimePickerProps) {
  const parts = parseTimeKey(value) ?? { hours: 9, minutes: 0 };
  const period = parts.hours >= 12 ? "pm" : "am";
  const hour12 = parts.hours % 12 === 0 ? 12 : parts.hours % 12;

  const update = (next: { hour12?: number; minutes?: number; period?: "am" | "pm" }) => {
    const nextHour12 = next.hour12 ?? hour12;
    const nextPeriod = next.period ?? period;
    const hours = (nextHour12 % 12) + (nextPeriod === "pm" ? 12 : 0);
    onChange(toTimeKey({ hours, minutes: next.minutes ?? parts.minutes }));
  };

  return (
    <View style={styles.container}>
      <AppText accessibilityLiveRegion="polite" align="center" variant="display">
        {formatTimeKey(toTimeKey(parts)) ?? ""}
      </AppText>

      <SegmentedControl
        accessibilityLabel="Morning or evening"
        onChange={(nextPeriod) => update({ period: nextPeriod })}
        options={PERIOD_OPTIONS}
        value={period}
      />

      <View style={styles.section}>
        <AppText color="textSecondary" variant="overline">
          Hour
        </AppText>
        <View style={styles.grid}>
          {HOURS_12.map((hour) => {
            const isSelected = hour === hour12;
            return (
              <Pressable
                accessibilityLabel={`${hour} o'clock`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={hour}
                onPress={() => update({ hour12: hour })}
                style={({ pressed }) => [
                  styles.cell,
                  styles.hourCell,
                  isSelected ? styles.cellSelected : null,
                  pressed && !isSelected ? styles.cellPressed : null,
                ]}
              >
                <AppText color={isSelected ? "textInverse" : "textPrimary"} variant="label">
                  {hour}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <AppText color="textSecondary" variant="overline">
          Minutes
        </AppText>
        <View style={styles.grid}>
          {MINUTES.map((minute) => {
            const isSelected = minute === parts.minutes;
            return (
              <Pressable
                accessibilityLabel={`${minute} minutes`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={minute}
                onPress={() => update({ minutes: minute })}
                style={({ pressed }) => [
                  styles.cell,
                  styles.minuteCell,
                  isSelected ? styles.cellSelected : null,
                  pressed && !isSelected ? styles.cellPressed : null,
                ]}
              >
                <AppText color={isSelected ? "textInverse" : "textPrimary"} variant="label">
                  :{String(minute).padStart(2, "0")}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    height: 42,
    justifyContent: "center",
  },
  hourCell: {
    width: "22%",
    flexGrow: 1,
  },
  minuteCell: {
    width: "14%",
    flexGrow: 1,
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  cellPressed: {
    backgroundColor: colors.primarySoft,
  },
});

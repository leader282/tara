import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import {
  clampMonthToRange,
  compareDateKeys,
  getDaysInMonth,
  getMonthGrid,
  parseDateKey,
  shiftMonth,
  toDateKey,
  toDateKeyFromParts,
} from "@/lib/dates/calendar";
import { colors, radii, spacing } from "@/theme/tokens";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const YEAR_ROW_HEIGHT = 52;
const YEARS_PER_ROW = 4;

type CalendarPickerProps = {
  value: string | null;
  onSelect: (dateKey: string) => void;
  minDate?: string;
  maxDate?: string;
};

function isOutOfRange(dateKey: string, minDate?: string, maxDate?: string): boolean {
  if (minDate && compareDateKeys(dateKey, minDate) < 0) {
    return true;
  }

  return Boolean(maxDate && compareDateKeys(dateKey, maxDate) > 0);
}

export function CalendarPicker({ value, onSelect, minDate, maxDate }: CalendarPickerProps) {
  const todayKey = toDateKey(new Date());
  const initialParts =
    parseDateKey(value) ??
    parseDateKey(isOutOfRange(todayKey, minDate, maxDate) ? (minDate ?? maxDate) : todayKey) ??
    parseDateKey(todayKey)!;
  const [visibleMonth, setVisibleMonth] = useState({
    year: initialParts.year,
    month: initialParts.month,
  });
  const [mode, setMode] = useState<"days" | "years">("days");

  const currentYear = new Date().getFullYear();
  const minYear = parseDateKey(minDate)?.year ?? currentYear - 100;
  const maxYear = parseDateKey(maxDate)?.year ?? currentYear + 10;
  const weeks = useMemo(
    () => getMonthGrid(visibleMonth.year, visibleMonth.month),
    [visibleMonth.month, visibleMonth.year],
  );

  const previousMonth = shiftMonth(visibleMonth.year, visibleMonth.month, -1);
  const nextMonth = shiftMonth(visibleMonth.year, visibleMonth.month, 1);
  const canGoBack =
    !minDate ||
    compareDateKeys(
      toDateKeyFromParts({
        ...previousMonth,
        day: getDaysInMonth(previousMonth.year, previousMonth.month),
      }),
      minDate,
    ) >= 0;
  const canGoForward =
    !maxDate || compareDateKeys(toDateKeyFromParts({ ...nextMonth, day: 1 }), maxDate) <= 0;

  const isFutureRange = Boolean(minDate) && !maxDate;
  const years = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, index) =>
        isFutureRange ? minYear + index : maxYear - index,
      ),
    [isFutureRange, maxYear, minYear],
  );
  const selectedYearRow = Math.floor(years.indexOf(visibleMonth.year) / YEARS_PER_ROW);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityHint="Switches between choosing a day and choosing a year"
          accessibilityLabel={`${MONTH_LABELS[visibleMonth.month - 1]} ${visibleMonth.year}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setMode((current) => (current === "days" ? "years" : "days"))}
          style={styles.monthButton}
        >
          <AppText variant="subtitle">
            {MONTH_LABELS[visibleMonth.month - 1]} {visibleMonth.year}
          </AppText>
          <Icon color="primary" name={mode === "days" ? "chevron-down" : "chevron-up"} size={16} />
        </Pressable>
        {mode === "days" ? (
          <View style={styles.navButtons}>
            <IconButton
              accessibilityLabel="Previous month"
              disabled={!canGoBack}
              icon="chevron-back"
              onPress={() => setVisibleMonth(previousMonth)}
              size={38}
              variant="surface"
            />
            <IconButton
              accessibilityLabel="Next month"
              disabled={!canGoForward}
              icon="chevron-forward"
              onPress={() => setVisibleMonth(nextMonth)}
              size={38}
              variant="surface"
            />
          </View>
        ) : null}
      </View>

      {mode === "years" ? (
        <ScrollView
          contentOffset={{ x: 0, y: Math.max(0, (selectedYearRow - 2) * YEAR_ROW_HEIGHT) }}
          showsVerticalScrollIndicator={false}
          style={styles.yearScroll}
        >
          <View style={styles.yearGrid}>
            {years.map((year) => {
              const isSelected = year === visibleMonth.year;
              return (
                <Pressable
                  accessibilityLabel={String(year)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={year}
                  onPress={() => {
                    setVisibleMonth((current) =>
                      clampMonthToRange({ year, month: current.month }, minDate, maxDate),
                    );
                    setMode("days");
                  }}
                  style={[styles.yearCell, isSelected ? styles.selectedCell : null]}
                >
                  <AppText color={isSelected ? "textInverse" : "textPrimary"} variant="label">
                    {year}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <View>
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((label, index) => (
              <View key={`${label}-${index}`} style={styles.weekdayCell}>
                <AppText color="textTertiary" variant="caption">
                  {label}
                </AppText>
              </View>
            ))}
          </View>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <View key={`empty-${dayIndex}`} style={styles.dayCell} />;
                }

                const dateKey = toDateKeyFromParts({ ...visibleMonth, day });
                const isSelected = dateKey === value;
                const isToday = dateKey === todayKey;
                const isDisabled = isOutOfRange(dateKey, minDate, maxDate);

                return (
                  <Pressable
                    accessibilityLabel={`${MONTH_LABELS[visibleMonth.month - 1]} ${day}, ${visibleMonth.year}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isDisabled, selected: isSelected }}
                    disabled={isDisabled}
                    key={dateKey}
                    onPress={() => onSelect(dateKey)}
                    style={styles.dayCell}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.dayCircle,
                          isToday && !isSelected ? styles.todayCircle : null,
                          isSelected ? styles.selectedCell : null,
                          pressed && !isSelected ? styles.pressedCell : null,
                        ]}
                      >
                        <AppText
                          color={
                            isSelected ? "textInverse" : isDisabled ? "textTertiary" : "textPrimary"
                          }
                          style={isDisabled ? styles.disabledDay : null}
                          variant={isSelected || isToday ? "label" : "body"}
                        >
                          {day}
                        </AppText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 38,
  },
  navButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  weekRow: {
    flexDirection: "row",
  },
  weekdayCell: {
    alignItems: "center",
    flex: 1,
    paddingBottom: spacing.xs,
  },
  dayCell: {
    alignItems: "center",
    flex: 1,
    height: 46,
    justifyContent: "center",
  },
  dayCircle: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  todayCircle: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  pressedCell: {
    backgroundColor: colors.primarySoft,
  },
  disabledDay: {
    opacity: 0.45,
  },
  yearScroll: {
    maxHeight: YEAR_ROW_HEIGHT * 5,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  yearCell: {
    alignItems: "center",
    borderRadius: radii.md,
    height: YEAR_ROW_HEIGHT - spacing.sm,
    justifyContent: "center",
    marginVertical: spacing.xs,
    width: `${100 / YEARS_PER_ROW}%`,
  },
});

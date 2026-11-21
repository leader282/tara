import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/ui";
import { RitualStatusBadge } from "@/features/rituals/components/RitualStatusBadge";
import type { RitualHistoryItem as RitualHistoryEntry } from "@/features/rituals/types";
import { formatDateOnly } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";

type RitualHistoryItemProps = {
  item: RitualHistoryEntry;
  onPress: (ritualId: string) => void;
};

function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function RitualHistoryItem({ item, onPress }: RitualHistoryItemProps) {
  const title = item.template?.title ?? "Daily ritual";
  const categoryLabel = item.template ? formatCategoryLabel(item.template.category) : "Ritual";
  const scheduledDateLabel =
    formatDateOnly(item.coupleRitual.scheduled_for) ?? item.coupleRitual.scheduled_for;
  const isCompleted = item.coupleRitual.status === "completed";

  return (
    <Pressable
      accessibilityLabel={`Open ritual details for ${title}`}
      accessibilityRole="button"
      onPress={() => onPress(item.coupleRitual.id)}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={[styles.iconWell, isCompleted ? styles.iconWellDone : null]}>
        <Icon
          color={isCompleted ? "success" : "warning"}
          name={isCompleted ? "checkmark-done" : "sparkles-outline"}
          size={18}
        />
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.title} variant="label">
          {title}
        </AppText>
        <AppText color="textSecondary" numberOfLines={1} variant="caption">
          {scheduledDateLabel} · {categoryLabel}
        </AppText>
      </View>
      <RitualStatusBadge status={item.coupleRitual.status} />
      <Icon color="textTertiary" name="chevron-forward" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.warningSoft,
    borderRadius: radii.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  iconWellDone: {
    backgroundColor: colors.successSoft,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
});

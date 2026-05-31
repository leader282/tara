import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { RitualStatusBadge } from "@/features/rituals/components/RitualStatusBadge";
import type { RitualHistoryItem as RitualHistoryEntry } from "@/features/rituals/types";
import { formatDateOnly } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

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
  const scheduledDateLabel = formatDateOnly(item.coupleRitual.scheduled_for) ?? item.coupleRitual.scheduled_for;

  return (
    <Pressable
      accessibilityLabel={`Open ritual details for ${title}`}
      accessibilityRole="button"
      onPress={() => onPress(item.coupleRitual.id)}
      style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
    >
      <View style={styles.header}>
        <AppText variant="body">{title}</AppText>
        <RitualStatusBadge status={item.coupleRitual.status} />
      </View>
      <View style={styles.meta}>
        <AppText color="textSecondary" variant="caption">
          {scheduledDateLabel}
        </AppText>
        <AppText color="textSecondary" variant="caption">
          {categoryLabel}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});

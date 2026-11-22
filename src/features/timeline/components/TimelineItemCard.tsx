import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { TimelineMetaLine } from "@/features/timeline/components/TimelineMetaLine";
import { TimelineTypeIcon } from "@/features/timeline/components/TimelineTypeIcon";
import {
  getTimelineAccessibilityLabel,
  getTimelineDetailLines,
  getTimelineTitle,
} from "@/features/timeline/details";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { colors, radii, spacing } from "@/theme/tokens";

const ICON_CENTER_OFFSET = spacing.md + 21;

type TimelineItemCardProps = {
  item: TimelineDisplayItem;
  // "You" or the partner's name, for moments one of you sent.
  actorName?: string | null;
  isFirst?: boolean;
  isLast?: boolean;
};

export function TimelineItemCard({ item, actorName = null, isFirst = false, isLast = false }: TimelineItemCardProps) {
  const title = getTimelineTitle(item, actorName);
  const lines = getTimelineDetailLines(item);
  const lineStyle =
    isFirst && isLast
      ? null
      : isFirst
        ? styles.lineFromIcon
        : isLast
          ? styles.lineToIcon
          : styles.lineFull;

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        {lineStyle ? <View style={[styles.railLine, lineStyle]} /> : null}
        <TimelineTypeIcon item={item} />
      </View>
      <Card
        accessibilityLabel={getTimelineAccessibilityLabel(item, title, lines)}
        padding="md"
        style={styles.card}
      >
        <AppText style={styles.title} variant="label">
          {title}
        </AppText>
        {lines.length > 0 ? (
          <View style={styles.detail}>
            {lines.map((line) => (
              <TimelineMetaLine icon={line.icon} key={line.label} label={line.label} />
            ))}
          </View>
        ) : null}
        {item.message ? (
          <View style={styles.message}>
            <AppText variant="bodyMuted">{item.message}</AppText>
          </View>
        ) : null}
        <AppText color="textTertiary" variant="caption">
          {item.createdAtLabel}
        </AppText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rail: {
    alignItems: "center",
    paddingTop: spacing.md,
    width: 42,
  },
  railLine: {
    backgroundColor: colors.border,
    position: "absolute",
    width: 2,
  },
  lineFull: {
    bottom: -spacing.md,
    top: 0,
  },
  lineFromIcon: {
    bottom: -spacing.md,
    top: ICON_CENTER_OFFSET,
  },
  lineToIcon: {
    height: ICON_CENTER_OFFSET,
    top: 0,
  },
  card: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  detail: {
    gap: spacing.xs,
  },
  message: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderTopLeftRadius: radii.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});

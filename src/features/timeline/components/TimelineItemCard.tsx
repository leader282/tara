import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon } from "@/components/ui";
import { TimelineCapsuleItem } from "@/features/timeline/components/TimelineCapsuleItem";
import { TimelineCountdownItem } from "@/features/timeline/components/TimelineCountdownItem";
import { TimelinePresenceItem } from "@/features/timeline/components/TimelinePresenceItem";
import { TimelineRitualItem } from "@/features/timeline/components/TimelineRitualItem";
import { TimelineTypeIcon } from "@/features/timeline/components/TimelineTypeIcon";
import { TimelineUnknownItem } from "@/features/timeline/components/TimelineUnknownItem";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { colors, spacing } from "@/theme/tokens";

const ICON_CENTER_OFFSET = spacing.md + 21;

type TimelineItemCardProps = {
  item: TimelineDisplayItem;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: (item: TimelineDisplayItem) => void;
};

function renderTimelineDetail(item: TimelineDisplayItem) {
  switch (item.type) {
    case "presence_sent":
      return <TimelinePresenceItem item={item} />;
    case "ritual_completed":
      return <TimelineRitualItem item={item} />;
    case "capsule_created":
    case "capsule_opened":
      return <TimelineCapsuleItem item={item} />;
    case "countdown_updated":
      return <TimelineCountdownItem item={item} />;
    case "parallel_moment_completed":
    case "unknown":
    default:
      return <TimelineUnknownItem />;
  }
}

export function TimelineItemCard({
  item,
  isFirst = false,
  isLast = false,
  onPress,
}: TimelineItemCardProps) {
  const canPress = Boolean(item.navigationTarget && onPress);
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
        accessibilityHint={canPress ? "Opens moment details" : undefined}
        accessibilityLabel={`${item.typeLabel}: ${item.title}`}
        onPress={canPress && onPress ? () => onPress(item) : undefined}
        padding="md"
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText style={styles.title} variant="label">
              {item.title}
            </AppText>
            {item.subtitle ? (
              <AppText color="textSecondary" variant="bodyMuted">
                {item.subtitle}
              </AppText>
            ) : null}
          </View>
          {canPress ? <Icon color="textTertiary" name="chevron-forward" size={16} /> : null}
        </View>
        <View style={styles.detail}>{renderTimelineDetail(item)}</View>
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
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  detail: {
    gap: spacing.xs,
  },
});

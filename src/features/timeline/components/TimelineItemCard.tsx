import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { TimelineCapsuleItem } from "@/features/timeline/components/TimelineCapsuleItem";
import { TimelineCountdownItem } from "@/features/timeline/components/TimelineCountdownItem";
import { TimelinePresenceItem } from "@/features/timeline/components/TimelinePresenceItem";
import { TimelineRitualItem } from "@/features/timeline/components/TimelineRitualItem";
import { TimelineTypeIcon } from "@/features/timeline/components/TimelineTypeIcon";
import { TimelineUnknownItem } from "@/features/timeline/components/TimelineUnknownItem";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { spacing } from "@/theme/tokens";

type TimelineItemCardProps = {
  item: TimelineDisplayItem;
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

export function TimelineItemCard({ item, onPress }: TimelineItemCardProps) {
  const canPress = Boolean(item.navigationTarget && onPress);

  return (
    <Pressable
      accessibilityHint={canPress ? "Opens moment details" : undefined}
      accessibilityLabel={`${item.typeLabel}: ${item.title}`}
      accessibilityRole={canPress ? "button" : undefined}
      accessibilityState={{ disabled: !canPress }}
      disabled={!canPress}
      onPress={() => {
        if (!canPress || !onPress) {
          return;
        }

        onPress(item);
      }}
      style={({ pressed }) => [pressed && canPress ? styles.pressed : null]}
    >
      <Card>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TimelineTypeIcon iconText={item.iconText} typeLabel={item.typeLabel} />
            <View style={styles.headerText}>
              <AppText variant="subtitle">{item.title}</AppText>
              {item.subtitle ? (
                <AppText color="textSecondary" variant="bodyMuted">
                  {item.subtitle}
                </AppText>
              ) : null}
              <AppText color="textSecondary" variant="caption">
                {item.createdAtLabel}
              </AppText>
            </View>
          </View>
          <View style={styles.detail}>{renderTimelineDetail(item)}</View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  detail: {
    gap: spacing.xs,
  },
});

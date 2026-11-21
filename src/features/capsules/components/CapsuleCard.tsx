import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon } from "@/components/ui";
import { CapsuleStatusBadge } from "@/features/capsules/components/CapsuleStatusBadge";
import type { CapsuleListItem } from "@/features/capsules/types";
import { formatUnlockDateTime } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";

type CapsuleCardProps = {
  item: CapsuleListItem;
  onPress: (capsuleId: string) => void;
};

function getCapsuleEmoji(status: CapsuleListItem["status"]): string {
  switch (status) {
    case "openable":
      return "🎁";
    case "opened":
      return "💌";
    default:
      return "🔒";
  }
}

function getWhenLabel(item: CapsuleListItem): string {
  if (item.isOpened) {
    const openedLabel = formatUnlockDateTime(item.capsule.opened_at);
    return openedLabel ? `Opened ${openedLabel}` : "Opened";
  }

  const unlockLabel = formatUnlockDateTime(item.capsule.unlock_at) ?? "soon";
  return item.status === "openable" ? `Unlocked ${unlockLabel}` : `Unlocks ${unlockLabel}`;
}

// The list's section headers already say whether a capsule is ready, waiting, or opened, so the
// card only marks the capsules you made.
export function CapsuleCard({ item, onPress }: CapsuleCardProps) {
  const isReady = item.status === "openable";

  return (
    <Card
      accessibilityLabel={`Open memory capsule ${item.capsule.title}`}
      onPress={() => onPress(item.capsule.id)}
      padding="md"
      style={isReady ? styles.readyCard : null}
    >
      <View style={styles.container}>
        <View style={[styles.emojiWell, isReady ? styles.emojiWellReady : null]}>
          <AppText style={styles.emoji}>{getCapsuleEmoji(item.status)}</AppText>
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText numberOfLines={1} style={styles.title} variant="label">
              {item.capsule.title}
            </AppText>
            {item.status === "created_by_me" ? <CapsuleStatusBadge status={item.status} /> : null}
          </View>
          {item.capsule.emotional_context ? (
            <AppText color="textSecondary" numberOfLines={2} variant="bodyMuted">
              {item.capsule.emotional_context}
            </AppText>
          ) : null}
          <View style={styles.metaRow}>
            <Icon color="textTertiary" name="time-outline" size={13} />
            <AppText color="textSecondary" numberOfLines={1} style={styles.meta} variant="caption">
              {getWhenLabel(item)}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  readyCard: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  emojiWell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  emojiWellReady: {
    backgroundColor: colors.primarySoft,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  meta: {
    flex: 1,
  },
});

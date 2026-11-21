import { StyleSheet, View } from "react-native";

import { AppText, Avatar } from "@/components/ui";
import { MediaGallery } from "@/features/media/components/MediaGallery";
import type { RitualCompletion } from "@/features/rituals/types";
import { formatDateTime } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";

type RitualRevealedResultProps = {
  myCompletion: RitualCompletion | null;
  partnerCompletion: RitualCompletion | null;
  partnerDisplayName?: string;
  completedAt?: string | null;
};

function getResponseText(completion: RitualCompletion | null): string | null {
  const text = completion?.text_response?.trim();
  return text && text.length > 0 ? text : null;
}

function formatCompletionDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) {
    return null;
  }

  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return formatDateTime(parsedDate);
}

function AnswerBubble({
  name,
  completion,
  isMine,
  mediaLabel,
}: {
  name: string;
  completion: RitualCompletion | null;
  isMine: boolean;
  mediaLabel: string;
}) {
  const responseText = getResponseText(completion);
  const media = completion?.media ?? [];

  return (
    <View style={styles.answer}>
      <View style={styles.answerHeader}>
        <Avatar name={name} size={28} tone={isMine ? "primary" : "ink"} />
        <AppText color="textSecondary" variant="label">
          {name}
        </AppText>
      </View>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : null]}>
        {responseText ? <AppText variant="body">{responseText}</AppText> : null}
        <MediaGallery label={mediaLabel} media={media} />
        {!responseText && media.length === 0 ? (
          <AppText color="textSecondary" variant="bodyMuted">
            No response shared.
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function RitualRevealedResult({
  myCompletion,
  partnerCompletion,
  partnerDisplayName = "Partner",
  completedAt,
}: RitualRevealedResultProps) {
  const completedLabel = formatCompletionDate(
    completedAt ?? partnerCompletion?.created_at ?? myCompletion?.created_at
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.headerEmoji}>✨</AppText>
        <AppText variant="subtitle">Both answers are revealed</AppText>
      </View>

      <AnswerBubble
        completion={partnerCompletion}
        isMine={false}
        mediaLabel={`${partnerDisplayName} ritual`}
        name={partnerDisplayName}
      />
      <AnswerBubble completion={myCompletion} isMine mediaLabel="Your ritual" name="You" />

      {completedLabel ? (
        <AppText color="textTertiary" variant="caption">
          Completed {completedLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  answer: {
    gap: spacing.sm,
  },
  answerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  bubble: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    borderTopLeftRadius: radii.xs,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primarySoft,
  },
});

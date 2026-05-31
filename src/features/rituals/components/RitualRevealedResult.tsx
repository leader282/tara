import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { PrivateImage } from "@/features/media/components/PrivateImage";
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

export function RitualRevealedResult({
  myCompletion,
  partnerCompletion,
  partnerDisplayName = "Partner",
  completedAt,
}: RitualRevealedResultProps) {
  const completedLabel = formatCompletionDate(completedAt ?? partnerCompletion?.created_at ?? myCompletion?.created_at);

  return (
    <View style={styles.container}>
      <AppText variant="subtitle">Both answers are revealed</AppText>

      <View style={styles.responseSection}>
        <AppText color="textSecondary" variant="caption">
          You
        </AppText>
        <View style={styles.responseCard}>
          {getResponseText(myCompletion) ? (
            <AppText variant="body">{getResponseText(myCompletion)}</AppText>
          ) : null}
          {myCompletion?.media_asset_id ? (
            <PrivateImage
              accessibilityLabel="Your ritual photo"
              containerStyle={styles.mediaPreview}
              mediaAssetId={myCompletion.media_asset_id}
            />
          ) : null}
          {!getResponseText(myCompletion) && !myCompletion?.media_asset_id ? (
            <AppText color="textSecondary" variant="bodyMuted">
              No response shared.
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.responseSection}>
        <AppText color="textSecondary" variant="caption">
          {partnerDisplayName}
        </AppText>
        <View style={styles.responseCard}>
          {getResponseText(partnerCompletion) ? (
            <AppText variant="body">{getResponseText(partnerCompletion)}</AppText>
          ) : null}
          {partnerCompletion?.media_asset_id ? (
            <PrivateImage
              accessibilityLabel={`${partnerDisplayName} ritual photo`}
              containerStyle={styles.mediaPreview}
              mediaAssetId={partnerCompletion.media_asset_id}
            />
          ) : null}
          {!getResponseText(partnerCompletion) && !partnerCompletion?.media_asset_id ? (
            <AppText color="textSecondary" variant="bodyMuted">
              No response shared.
            </AppText>
          ) : null}
        </View>
      </View>

      {completedLabel ? (
        <AppText color="textSecondary" variant="caption">
          Completed {completedLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  responseSection: {
    gap: spacing.xs,
  },
  responseCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  mediaPreview: {
    aspectRatio: 4 / 3,
    borderRadius: radii.sm,
    overflow: "hidden",
    width: "100%",
  },
});

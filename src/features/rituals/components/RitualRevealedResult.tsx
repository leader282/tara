import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import type { RitualCompletion } from "@/features/rituals/types";
import { formatDateTime } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";

type RitualRevealedResultProps = {
  myCompletion: RitualCompletion | null;
  partnerCompletion: RitualCompletion | null;
  partnerDisplayName?: string;
  completedAt?: string | null;
};

function getResponseText(completion: RitualCompletion | null): string {
  const text = completion?.text_response?.trim();
  if (!text) {
    return "No text shared.";
  }

  return text;
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
          <AppText variant="body">{getResponseText(myCompletion)}</AppText>
        </View>
      </View>

      <View style={styles.responseSection}>
        <AppText color="textSecondary" variant="caption">
          {partnerDisplayName}
        </AppText>
        <View style={styles.responseCard}>
          <AppText variant="body">{getResponseText(partnerCompletion)}</AppText>
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
    padding: spacing.md,
  },
});

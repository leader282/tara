import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, EmptyState } from "@/components/ui";
import { CapsuleHero } from "@/features/capsules/components/CapsuleHero";
import { PrivateImage } from "@/features/media/components/PrivateImage";
import type { MemoryCapsule, MemoryCapsuleContent } from "@/features/capsules/types";
import { formatUnlockDateTime } from "@/lib/dates/format";
import { radii, spacing } from "@/theme/tokens";

type CapsuleOpenedContentProps = {
  capsule: MemoryCapsule;
  content: MemoryCapsuleContent | null;
  isRefreshing?: boolean;
  onRetry?: () => void;
};

export function CapsuleOpenedContent({
  capsule,
  content,
  isRefreshing = false,
  onRetry,
}: CapsuleOpenedContentProps) {
  const openedLabel = formatUnlockDateTime(capsule.opened_at) ?? "Just now";
  const normalizedNote = content?.note?.trim() ?? null;
  const mediaAssetId = content?.media_asset_id ?? null;
  const hasVisibleContent = Boolean(normalizedNote || mediaAssetId);

  return (
    <View style={styles.container}>
      <CapsuleHero capsule={capsule} emoji="💌" />

      {hasVisibleContent ? (
        <Card>
          <View style={styles.content}>
            <AppText color="textSecondary" variant="overline">
              Memory content
            </AppText>
            {normalizedNote ? (
              <AppText style={styles.note} variant="body">
                {normalizedNote}
              </AppText>
            ) : null}
            {mediaAssetId ? (
              <PrivateImage
                accessibilityLabel="Capsule photo"
                containerStyle={styles.media}
                mediaAssetId={mediaAssetId}
              />
            ) : null}
            <AppText color="textTertiary" variant="caption">
              Opened {openedLabel}
            </AppText>
          </View>
        </Card>
      ) : (
        <Card>
          <EmptyState
            compact
            description="We opened this capsule, but its content has not loaded yet."
            icon="cloud-offline-outline"
            title="Memory content"
          />
          {onRetry ? (
            <Button
              disabled={isRefreshing}
              icon="refresh"
              loading={isRefreshing}
              onPress={onRetry}
              size="md"
              title="Try again"
              variant="outline"
            />
          ) : null}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  content: {
    gap: spacing.md,
  },
  note: {
    fontSize: 17,
    lineHeight: 27,
  },
  media: {
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: "hidden",
    width: "100%",
  },
});

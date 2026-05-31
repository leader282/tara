import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
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

  if (!hasVisibleContent) {
    return (
      <Card>
        <View style={styles.container}>
          <AppText variant="subtitle">Memory content</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            We opened this capsule, but its content has not loaded yet.
          </AppText>
          <AppText color="textSecondary" variant="caption">
            Opened {openedLabel}
          </AppText>
          {onRetry ? (
            <Button
              disabled={isRefreshing}
              loading={isRefreshing}
              onPress={onRetry}
              title="Try again"
              variant="secondary"
            />
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="subtitle">Memory content</AppText>
        {normalizedNote ? <AppText variant="body">{normalizedNote}</AppText> : null}
        {mediaAssetId ? (
          <PrivateImage
            accessibilityLabel="Capsule photo"
            containerStyle={styles.media}
            mediaAssetId={mediaAssetId}
          />
        ) : null}
        {capsule.emotional_context ? (
          <AppText color="textSecondary" variant="bodyMuted">
            {capsule.emotional_context}
          </AppText>
        ) : null}
        <AppText color="textSecondary" variant="caption">
          Opened {openedLabel}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  media: {
    aspectRatio: 4 / 3,
    borderRadius: radii.sm,
    overflow: "hidden",
    width: "100%",
  },
});

import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, EmptyState } from "@/components/ui";
import { CapsuleHero } from "@/features/capsules/components/CapsuleHero";
import { MediaGallery } from "@/features/media/components/MediaGallery";
import type { AttachedMedia } from "@/features/media/types";
import type { MemoryCapsule, MemoryCapsuleContent } from "@/features/capsules/types";
import { formatUnlockDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type CapsuleOpenedContentProps = {
  capsule: MemoryCapsule;
  content: MemoryCapsuleContent | null;
  media: AttachedMedia[];
  isRefreshing?: boolean;
  onRetry?: () => void;
};

export function CapsuleOpenedContent({
  capsule,
  content,
  media,
  isRefreshing = false,
  onRetry,
}: CapsuleOpenedContentProps) {
  const openedLabel = formatUnlockDateTime(capsule.opened_at) ?? "Just now";
  const normalizedNote = content?.note?.trim() ?? null;
  const hasVisibleContent = Boolean(normalizedNote || media.length > 0);

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
            <MediaGallery label="Capsule" media={media} />
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
});

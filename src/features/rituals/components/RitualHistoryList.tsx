import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, EmptyState, LoadingState } from "@/components/ui";
import { RitualHistoryItem } from "@/features/rituals/components/RitualHistoryItem";
import type { RitualHistoryItem as RitualHistoryEntry } from "@/features/rituals/types";
import { spacing } from "@/theme/tokens";

type RitualHistoryListProps = {
  history: RitualHistoryEntry[];
  isLoading: boolean;
  errorMessage?: string | null;
  onItemPress: (ritualId: string) => void;
  onRetry?: () => void;
};

export function RitualHistoryList({
  history,
  isLoading,
  errorMessage = null,
  onItemPress,
  onRetry,
}: RitualHistoryListProps) {
  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="subtitle">Ritual history</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Small shared memories, one day at a time.
          </AppText>
        </View>

        {isLoading ? <LoadingState label="Loading ritual history..." /> : null}

        {!isLoading && errorMessage ? (
          <View style={styles.error}>
            <AppText color="danger" variant="caption">
              {errorMessage}
            </AppText>
            {onRetry ? <Button onPress={onRetry} title="Try again" variant="secondary" /> : null}
          </View>
        ) : null}

        {!isLoading && !errorMessage && history.length === 0 ? (
          <EmptyState
            description="Your rituals will gather here as small shared memories."
            title="No rituals yet"
          />
        ) : null}

        {!isLoading && !errorMessage && history.length > 0 ? (
          <View style={styles.list}>
            {history.map((historyItem) => (
              <RitualHistoryItem key={historyItem.coupleRitual.id} item={historyItem} onPress={onItemPress} />
            ))}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.lg,
  },
  error: {
    gap: spacing.md,
  },
});

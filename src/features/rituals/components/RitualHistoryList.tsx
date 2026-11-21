import { StyleSheet, View } from "react-native";

import {
  Button,
  Card,
  EmptyState,
  InlineMessage,
  ListGroup,
  SectionHeader,
  Skeleton,
} from "@/components/ui";
import { RitualHistoryItem } from "@/features/rituals/components/RitualHistoryItem";
import type { RitualHistoryItem as RitualHistoryEntry } from "@/features/rituals/types";
import { radii, spacing } from "@/theme/tokens";

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
    <View style={styles.container}>
      <SectionHeader
        description="Your 5 most recent rituals. Older ones are deleted."
        title="Ritual history"
      />

      {isLoading ? <Skeleton height={140} radius={radii.lg} /> : null}

      {!isLoading && errorMessage ? (
        <View style={styles.error}>
          <InlineMessage message={errorMessage} tone="danger" />
          {onRetry ? (
            <Button icon="refresh" onPress={onRetry} size="md" title="Try again" variant="outline" />
          ) : null}
        </View>
      ) : null}

      {!isLoading && !errorMessage && history.length === 0 ? (
        <Card>
          <EmptyState
            compact
            description="Rituals from earlier days will show up here."
            icon="journal-outline"
            title="No past rituals yet"
          />
        </Card>
      ) : null}

      {!isLoading && !errorMessage && history.length > 0 ? (
        <ListGroup inset={68}>
          {history.map((historyItem) => (
            <RitualHistoryItem
              item={historyItem}
              key={historyItem.coupleRitual.id}
              onPress={onItemPress}
            />
          ))}
        </ListGroup>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  error: {
    gap: spacing.md,
  },
});

import { type ReactElement } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, InlineMessage } from "@/components/ui";
import { TimelineEmptyState } from "@/features/timeline/components/TimelineEmptyState";
import { TimelineItemCard } from "@/features/timeline/components/TimelineItemCard";
import { TimelineLoadingFooter } from "@/features/timeline/components/TimelineLoadingFooter";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { toDateKey } from "@/lib/dates/calendar";
import { formatDate } from "@/lib/dates/format";
import { colors, layout, spacing } from "@/theme/tokens";

type TimelineListProps = {
  items: TimelineDisplayItem[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  errorMessage?: string | null;
  header?: ReactElement;
  onRefresh: () => void;
  onLoadMore: () => void;
  // "You" or the partner's name for a moment's sender.
  getActorName?: (actorId: string | null) => string | null;
};

function getDayKey(isoString: string): string {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? "unknown" : toDateKey(date);
}

function formatDayLabel(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Earlier";
  }

  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const dayKey = toDateKey(date);

  if (dayKey === toDateKey(today)) {
    return "Today";
  }

  if (dayKey === toDateKey(yesterday)) {
    return "Yesterday";
  }

  return formatDate(date, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

export function TimelineList({
  items,
  isRefreshing,
  isFetchingNextPage,
  hasNextPage,
  errorMessage = null,
  header,
  onRefresh,
  onLoadMore,
  getActorName,
}: TimelineListProps) {
  const insets = useSafeAreaInsets();

  const handleEndReached = () => {
    if (!hasNextPage || isFetchingNextPage || items.length === 0) {
      return;
    }

    onLoadMore();
  };

  return (
    <FlatList
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
        items.length === 0 ? styles.emptyContent : null,
      ]}
      data={items}
      ItemSeparatorComponent={ItemSeparator}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={TimelineEmptyState}
      ListFooterComponent={<TimelineLoadingFooter visible={isFetchingNextPage} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          {errorMessage && items.length > 0 ? (
            <InlineMessage message={errorMessage} tone="danger" />
          ) : null}
        </View>
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item, index }) => {
        const previous = items[index - 1];
        const next = items[index + 1];
        const dayKey = getDayKey(item.createdAt);
        const isFirstOfDay = !previous || getDayKey(previous.createdAt) !== dayKey;
        const isLastOfDay = !next || getDayKey(next.createdAt) !== dayKey;

        return (
          <View>
            {isFirstOfDay ? (
              <AppText
                color="textSecondary"
                style={[styles.dayLabel, index > 0 ? styles.dayLabelSpaced : null]}
                variant="overline"
              >
                {formatDayLabel(item.createdAt)}
              </AppText>
            ) : null}
            <TimelineItemCard
              actorName={getActorName?.(item.actorId) ?? null}
              isFirst={isFirstOfDay}
              isLast={isLastOfDay}
              item={item}
            />
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing["2xl"],
    paddingHorizontal: layout.gutter,
  },
  emptyContent: {
    flexGrow: 1,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  dayLabel: {
    marginBottom: spacing.md,
    marginLeft: 54,
  },
  dayLabelSpaced: {
    marginTop: spacing.md,
  },
});

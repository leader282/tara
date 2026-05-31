import { FlatList, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { TimelineEmptyState } from "@/features/timeline/components/TimelineEmptyState";
import { TimelineItemCard } from "@/features/timeline/components/TimelineItemCard";
import { TimelineLoadingFooter } from "@/features/timeline/components/TimelineLoadingFooter";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { spacing } from "@/theme/tokens";

type TimelineListProps = {
  items: TimelineDisplayItem[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  errorMessage?: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onItemPress: (item: TimelineDisplayItem) => void;
};

export function TimelineList({
  items,
  isRefreshing,
  isFetchingNextPage,
  hasNextPage,
  errorMessage = null,
  onRefresh,
  onLoadMore,
  onItemPress,
}: TimelineListProps) {
  const handleEndReached = () => {
    if (!hasNextPage || isFetchingNextPage || items.length === 0) {
      return;
    }

    onLoadMore();
  };

  return (
    <FlatList
      contentContainerStyle={[styles.content, items.length === 0 ? styles.emptyContent : null]}
      data={items}
      ItemSeparatorComponent={ItemSeparator}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={TimelineEmptyState}
      ListFooterComponent={<TimelineLoadingFooter visible={isFetchingNextPage} />}
      ListHeaderComponent={
        errorMessage && items.length > 0 ? (
          <View style={styles.errorBanner}>
            <AppText color="danger" variant="caption">
              {errorMessage}
            </AppText>
          </View>
        ) : null
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      renderItem={({ item }) => <TimelineItemCard item={item} onPress={onItemPress} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  separator: {
    height: spacing.md,
  },
  errorBanner: {
    marginBottom: spacing.md,
  },
});

import { useMemo } from "react";

import { useInfiniteQuery, type InfiniteData, type UseInfiniteQueryResult } from "@tanstack/react-query";

import { getTimelinePage } from "@/features/timeline/api/timelineApi";
import { DEFAULT_TIMELINE_PAGE_SIZE } from "@/features/timeline/constants";
import type { TimelineDisplayItem, TimelinePage } from "@/features/timeline/types";
import { toTimelineActionMessage } from "@/lib/errors/timelineErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_COUPLE_KEY = "unknown";
type TimelineInfiniteData = InfiniteData<TimelinePage, unknown>;
type TimelineInfiniteQueryResult = UseInfiniteQueryResult<TimelineInfiniteData, Error>;

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load timeline.");
}

export type UseTimelineResult = {
  items: TimelineDisplayItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: TimelineInfiniteQueryResult["refetch"];
  fetchNextPage: TimelineInfiniteQueryResult["fetchNextPage"];
  error: Error | null;
  friendlyError: string | null;
};

export function useTimeline(
  coupleId: string | null | undefined,
  pageSize: number = DEFAULT_TIMELINE_PAGE_SIZE
): UseTimelineResult {
  const timelineQuery = useInfiniteQuery<TimelinePage, Error>({
    queryKey: queryKeys.timeline.list(coupleId ?? UNKNOWN_COUPLE_KEY, pageSize),
    enabled: Boolean(coupleId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!coupleId) {
        return {
          items: [],
          nextPageParam: null,
          hasMore: false,
          pageSize,
        };
      }

      return getTimelinePage({
        coupleId,
        pageParam: typeof pageParam === "number" ? pageParam : 0,
        pageSize,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam ?? undefined,
  });

  return useMemo(() => {
    const error = toError(timelineQuery.error);
    const items = timelineQuery.data?.pages.flatMap((page) => page.items) ?? [];

    return {
      items,
      isLoading: timelineQuery.isLoading,
      isRefreshing: timelineQuery.isRefetching && !timelineQuery.isFetchingNextPage,
      isFetchingNextPage: timelineQuery.isFetchingNextPage,
      hasNextPage: timelineQuery.hasNextPage ?? false,
      refetch: timelineQuery.refetch,
      fetchNextPage: timelineQuery.fetchNextPage,
      error,
      friendlyError: error ? toTimelineActionMessage(error) : null,
    };
  }, [
    timelineQuery.data,
    timelineQuery.error,
    timelineQuery.fetchNextPage,
    timelineQuery.hasNextPage,
    timelineQuery.isFetchingNextPage,
    timelineQuery.isLoading,
    timelineQuery.isRefetching,
    timelineQuery.refetch,
  ]);
}

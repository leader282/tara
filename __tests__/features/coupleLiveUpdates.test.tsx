import React from "react";
import { AppState, type AppStateStatus } from "react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

type Subscription = { table: string; event: string; filter?: string; onChange: () => void };

const mockSubscriptions: Subscription[] = [];
const mockRemovedChannels: string[] = [];
const mockStatusListeners: Array<(status: string) => void> = [];
const mockUserId = "99999999-9999-4999-8999-999999999999";

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: (name: string) => {
      const channel = {
        name,
        on(
          _type: string,
          options: { table: string; event: string; filter?: string },
          onChange: () => void
        ) {
          mockSubscriptions.push({ ...options, onChange });
          return channel;
        },
        subscribe(onStatus: (status: string) => void) {
          mockStatusListeners.push(onStatus);
          return channel;
        },
      };
      return channel;
    },
    removeChannel: async (channel: { name: string }) => {
      mockRemovedChannels.push(channel.name);
    },
  },
}));

jest.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: mockUserId } }),
}));

import { useCoupleLiveUpdates } from "@/features/couple/hooks/useCoupleLiveUpdates";

const COUPLE_ID = "77777777-7777-4777-8777-777777777777";

function CoupleListener({ coupleId }: { coupleId: string | null }) {
  useCoupleLiveUpdates(coupleId);
  return null;
}

function renderListener(queryClient: QueryClient, coupleId: string | null) {
  return render(
    <QueryClientProvider client={queryClient}>
      <CoupleListener coupleId={coupleId} />
    </QueryClientProvider>
  );
}

function triggerChange(table: string, event = "UPDATE") {
  mockSubscriptions.find((subscription) => subscription.table === table && subscription.event === event)?.onChange();
}

function refreshedKeys(invalidateQueries: ReturnType<typeof jest.spyOn>) {
  return invalidateQueries.mock.calls.map((call: unknown[]) => {
    const [{ queryKey, refetchType }] = call as [{ queryKey: unknown[]; refetchType: string }];
    expect(refetchType).toBe("all");
    return queryKey.join("/");
  });
}

describe("couple live updates", () => {
  let appStateListener: ((state: AppStateStatus) => void) | null = null;

  beforeEach(() => {
    mockSubscriptions.length = 0;
    mockRemovedChannels.length = 0;
    mockStatusListeners.length = 0;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      appStateListener = listener as (state: AppStateStatus) => void;
      return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("listens to everything both partners see", () => {
    renderListener(new QueryClient(), COUPLE_ID);

    expect(mockSubscriptions.map(({ table, event, filter }) => [table, event, filter])).toEqual([
      ["couples", "UPDATE", `id=eq.${COUPLE_ID}`],
      ["couple_members", "UPDATE", `user_id=eq.${mockUserId}`],
      ["couple_rituals", "INSERT", `couple_id=eq.${COUPLE_ID}`],
      ["couple_rituals", "UPDATE", `couple_id=eq.${COUPLE_ID}`],
      ["memory_capsules", "INSERT", `couple_id=eq.${COUPLE_ID}`],
      ["memory_capsules", "UPDATE", `couple_id=eq.${COUPLE_ID}`],
      ["timeline_items", "INSERT", `couple_id=eq.${COUPLE_ID}`],
      ["profiles", "UPDATE", undefined],
      ["couple_settings", "UPDATE", `couple_id=eq.${COUPLE_ID}`],
    ]);
  });

  it("refreshes couple data, including screens that aren't open, when the partner unpairs", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    renderListener(queryClient, COUPLE_ID);

    triggerChange("couple_members");

    expect(refreshedKeys(invalidateQueries)).toEqual(["couple", `settings/couple/${COUPLE_ID}`, "timeline"]);
  });

  it("refreshes rituals and the timeline when the partner answers", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    renderListener(queryClient, COUPLE_ID);

    triggerChange("couple_rituals");

    expect(refreshedKeys(invalidateQueries)).toEqual(["rituals", "timeline"]);
  });

  it("refreshes the partner card when the partner edits their profile", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    renderListener(queryClient, COUPLE_ID);

    triggerChange("profiles");

    expect(refreshedKeys(invalidateQueries)).toEqual([`couple/home/${mockUserId}`]);
  });

  it("catches up after the connection drops and rejoins, but not on the first join", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    renderListener(queryClient, COUPLE_ID);

    mockStatusListeners[0]?.("SUBSCRIBED");
    expect(invalidateQueries).not.toHaveBeenCalled();

    mockStatusListeners[0]?.("CHANNEL_ERROR");
    mockStatusListeners[0]?.("SUBSCRIBED");
    expect(refreshedKeys(invalidateQueries)).toEqual([
      "couple",
      `settings/couple/${COUPLE_ID}`,
      "rituals",
      "capsules",
      "timeline",
      "presence",
    ]);
  });

  it("catches up after the app was away for a while, but not after a quick photo pick", () => {
    jest.useFakeTimers();
    const queryClient = new QueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    renderListener(queryClient, COUPLE_ID);

    appStateListener?.("background");
    jest.advanceTimersByTime(5_000);
    appStateListener?.("active");
    expect(invalidateQueries).not.toHaveBeenCalled();

    appStateListener?.("background");
    jest.advanceTimersByTime(60_000);
    appStateListener?.("active");
    expect(invalidateQueries).toHaveBeenCalledTimes(6);
  });

  it("stops listening once there is no couple", () => {
    const queryClient = new QueryClient();
    const { rerender } = renderListener(queryClient, COUPLE_ID);

    rerender(
      <QueryClientProvider client={queryClient}>
        <CoupleListener coupleId={null} />
      </QueryClientProvider>
    );

    expect(mockRemovedChannels).toHaveLength(1);
    expect(mockRemovedChannels[0]).toMatch(new RegExp(`^couple-updates-${COUPLE_ID}-`));
  });
});

import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

type Subscription = { table: string; filter: string; onChange: () => void };

const mockSubscriptions: Subscription[] = [];
const mockRemovedChannels: string[] = [];
const mockUserId = "99999999-9999-4999-8999-999999999999";

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: (name: string) => {
      const channel = {
        name,
        on(_type: string, options: { table: string; filter: string }, onChange: () => void) {
          mockSubscriptions.push({ table: options.table, filter: options.filter, onChange });
          return channel;
        },
        subscribe() {
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

describe("couple live updates", () => {
  beforeEach(() => {
    mockSubscriptions.length = 0;
    mockRemovedChannels.length = 0;
  });

  it("listens for changes to the couple and to the member's own membership", () => {
    renderListener(new QueryClient(), COUPLE_ID);

    expect(mockSubscriptions.map(({ table, filter }) => [table, filter])).toEqual([
      ["couples", `id=eq.${COUPLE_ID}`],
      ["couple_members", `user_id=eq.${mockUserId}`],
    ]);
  });

  it("refreshes couple data, including screens that aren't open, when the partner unpairs", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    renderListener(queryClient, COUPLE_ID);

    mockSubscriptions.find(({ table }) => table === "couple_members")?.onChange();

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["couple"], refetchType: "all" });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["settings", "couple", COUPLE_ID],
      refetchType: "all",
    });
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

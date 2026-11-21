import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

type FakeChannel = {
  name: string;
  subscribed: boolean;
  on: () => FakeChannel;
  subscribe: () => FakeChannel;
};

const mockChannels = new Map<string, FakeChannel>();

// Mirrors supabase-js: a reused name returns the existing channel, and adding listeners to a
// channel that is already subscribed throws.
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: (name: string) => {
      const existing = mockChannels.get(name);
      if (existing) {
        return existing;
      }

      const channel: FakeChannel = {
        name,
        subscribed: false,
        on() {
          if (channel.subscribed) {
            throw new Error(`cannot add postgres_changes callbacks for ${name} after subscribe()`);
          }
          return channel;
        },
        subscribe() {
          channel.subscribed = true;
          return channel;
        },
      };
      mockChannels.set(name, channel);
      return channel;
    },
    removeChannel: async (channel: FakeChannel) => {
      mockChannels.delete(channel.name);
    },
  },
}));

jest.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

import { useRitualRealtime } from "@/features/rituals/hooks/useRitualRealtime";

const COUPLE_ID = "88888888-8888-4888-8888-888888888888";

function RitualListener() {
  useRitualRealtime(COUPLE_ID);
  return null;
}

describe("ritual realtime subscriptions", () => {
  it("lets the rituals tab and an open ritual detail listen at the same time", () => {
    const queryClient = new QueryClient();

    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <RitualListener />
          <RitualListener />
        </QueryClientProvider>
      )
    ).not.toThrow();
    expect(mockChannels.size).toBe(2);
  });
});

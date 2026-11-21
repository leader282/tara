import type { PropsWithChildren } from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";

jest.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "11111111-1111-4111-8111-111111111111" } }),
}));

jest.mock("@/features/invite/api/inviteApi", () => ({
  acceptCoupleInvite: jest.fn(async () => ({ couple_id: "22222222-2222-4222-8222-222222222222" })),
  createCoupleWithInvite: jest.fn(async () => ({ couple_id: "22222222-2222-4222-8222-222222222222" })),
}));

import { useAcceptCoupleInvite } from "@/features/invite/hooks/useAcceptCoupleInvite";
import { useCreateCoupleWithInvite } from "@/features/invite/hooks/useCreateCoupleWithInvite";
import { queryKeys } from "@/lib/query/queryKeys";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function setup() {
  // No garbage-collection timers, so nothing keeps Jest running after the test.
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity }, queries: { gcTime: Infinity } },
  });
  // What the couple home cached while this person was between couples.
  queryClient.setQueryData(queryKeys.couple.home(USER_ID), { status: "none" });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("pairing clears the couple home cache", () => {
  it("drops the unpaired home after joining with an invite", async () => {
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useAcceptCoupleInvite(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("INVITE-CODE-1234567890");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(queryClient.getQueryData(queryKeys.couple.home(USER_ID))).toBeUndefined();
  });

  it("drops the previous home after creating a new couple space", async () => {
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useCreateCoupleWithInvite(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(queryClient.getQueryData(queryKeys.couple.home(USER_ID))).toBeUndefined();
  });
});

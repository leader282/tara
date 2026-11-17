import type { ReactNode } from "react";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";

import { useResyncOnForeground } from "@/lib/query/useResyncOnForeground";

function renderResyncHook(enabled: boolean) {
  let emitAppState: (state: AppStateStatus) => void = () => {};
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
    emitAppState = listener;
    return { remove: jest.fn() } as unknown as NativeEventSubscription;
  });

  const queryClient = new QueryClient();
  const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  renderHook(() => useResyncOnForeground(enabled), { wrapper });

  return { emitAppState: (state: AppStateStatus) => emitAppState(state), invalidateQueries };
}

describe("useResyncOnForeground", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("refetches realtime-backed queries when the app returns to the foreground", () => {
    const { emitAppState, invalidateQueries } = renderResyncHook(true);

    emitAppState("background");
    expect(invalidateQueries).not.toHaveBeenCalled();

    emitAppState("active");
    expect(invalidateQueries).toHaveBeenCalledTimes(5);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["presence"], refetchType: "all" });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["rituals"], refetchType: "all" });
  });

  it("does nothing while signed out", () => {
    const { emitAppState, invalidateQueries } = renderResyncHook(false);

    emitAppState("background");
    emitAppState("active");
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});

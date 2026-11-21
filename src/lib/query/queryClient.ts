import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState } from "react-native";

const MINUTE = 60_000;

// Without this React Query treats a backgrounded app as focused and keeps refetch intervals running.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (appState) => {
    setFocused(appState === "active");
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * MINUTE,
      gcTime: 30 * MINUTE,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

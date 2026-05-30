import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/lib/query/queryClient";
import {
  startSupabaseAutoRefresh,
  stopSupabaseAutoRefresh,
} from "@/lib/supabase/client";
import { colors } from "@/theme/tokens";

export default function RootLayout() {
  useEffect(() => {
    startSupabaseAutoRefresh();
    return () => stopSupabaseAutoRefresh();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

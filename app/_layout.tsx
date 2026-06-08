import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { NotificationsProvider } from "@/features/notifications/providers/NotificationsProvider";
import { ErrorBoundary } from "@/lib/errors/ErrorBoundary";
import {
  initializeSentry,
  registerSentryNavigationContainer,
  withSentryRoot,
} from "@/lib/monitoring/sentry";
import { queryClient } from "@/lib/query/queryClient";
import {
  startSupabaseAutoRefresh,
  stopSupabaseAutoRefresh,
} from "@/lib/supabase/client";
import { colors } from "@/theme/tokens";

initializeSentry();

function RootNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!isInitializing && !isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isInitializing && isAuthenticated}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(invite)" options={{ headerShown: false }} />
        <Stack.Screen name="(couple)" options={{ headerShown: false }} />
        <Stack.Screen name="(settings)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  const navigationContainerRef = useNavigationContainerRef();

  useEffect(() => {
    registerSentryNavigationContainer(navigationContainerRef);
  }, [navigationContainerRef]);

  useEffect(() => {
    startSupabaseAutoRefresh();
    return () => stopSupabaseAutoRefresh();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationsProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </NotificationsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default withSentryRoot(RootLayout);

import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider, useNavigationContainerRef } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "@/components/feedback/ToastProvider";
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
import { useResyncOnForeground } from "@/lib/query/useResyncOnForeground";
import {
  startSupabaseAutoRefresh,
  stopSupabaseAutoRefresh,
} from "@/lib/supabase/client";
import { appFonts } from "@/theme/fonts";
import { colors } from "@/theme/tokens";

initializeSentry();
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.background,
    primary: colors.primary,
    text: colors.textPrimary,
  },
};

function RootNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();
  useResyncOnForeground(isAuthenticated);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/callback" />
      <Stack.Protected guard={!isInitializing && !isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!isInitializing && isAuthenticated}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(invite)" />
        <Stack.Screen name="(couple)" />
        <Stack.Screen name="(settings)" />
        <Stack.Screen name="(protected)" />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  const navigationContainerRef = useNavigationContainerRef();
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const isReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    registerSentryNavigationContainer(navigationContainerRef);
  }, [navigationContainerRef]);

  useEffect(() => {
    startSupabaseAutoRefresh();
    return () => stopSupabaseAutoRefresh();
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <ToastProvider>
              <AuthProvider>
                <NotificationsProvider>
                  <StatusBar style="dark" />
                  <RootNavigator />
                </NotificationsProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default withSentryRoot(RootLayout);

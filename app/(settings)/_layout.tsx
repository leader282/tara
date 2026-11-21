import { Redirect, Stack } from "expo-router";

import { GateErrorScreen, GateLoadingScreen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRetryAppGates } from "@/features/couple/hooks/useRetryAppGates";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";
import { colors } from "@/theme/tokens";

export default function SettingsLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const onboardingGate = useOnboardingGate();
  const retryGates = useRetryAppGates();

  if (isInitializing || onboardingGate.isLoading) {
    return <GateLoadingScreen label="Loading settings..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (onboardingGate.error) {
    return (
      <GateErrorScreen
        message="We couldn't load your profile state right now. Please try again."
        onRetry={retryGates}
        title="Settings unavailable"
      />
    );
  }

  if (onboardingGate.needsOnboarding) {
    return <Redirect href="/(onboarding)/profile" />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}

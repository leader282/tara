import { Redirect, Stack } from "expo-router";

import { GateErrorScreen, GateLoadingScreen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRetryAppGates } from "@/features/couple/hooks/useRetryAppGates";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";
import { colors } from "@/theme/tokens";

export default function OnboardingLayout() {
  const { isAuthenticated } = useAuth();
  const { isLoading, needsOnboarding, error } = useOnboardingGate();
  const retryGates = useRetryAppGates();

  if (isLoading) {
    return <GateLoadingScreen label="Setting up your Tara onboarding..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (error) {
    return (
      <GateErrorScreen
        message="We couldn't load your onboarding details right now. Please try again."
        onRetry={retryGates}
        title="Couldn’t open onboarding"
      />
    );
  }

  if (!needsOnboarding) {
    return <Redirect href="/" />;
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

import { Redirect, Stack } from "expo-router";

import { GateErrorScreen, GateLoadingScreen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { useRetryAppGates } from "@/features/couple/hooks/useRetryAppGates";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";
import { colors } from "@/theme/tokens";

export default function InviteLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const onboardingGate = useOnboardingGate();
  const coupleGate = useActiveCoupleState();
  const retryGates = useRetryAppGates();

  if (isInitializing || onboardingGate.isLoading) {
    return <GateLoadingScreen label="Preparing your private invite space..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (onboardingGate.error) {
    return (
      <GateErrorScreen
        message="We couldn't open invite setup right now. Please try again."
        onRetry={retryGates}
        title="Couldn’t open invite flow"
      />
    );
  }

  if (onboardingGate.needsOnboarding) {
    return <Redirect href="/(onboarding)/profile" />;
  }

  if (coupleGate.isLoading || coupleGate.state.status === "loading") {
    return <GateLoadingScreen label="Preparing your private invite space..." />;
  }

  if (coupleGate.error) {
    return (
      <GateErrorScreen
        message="We couldn't load your couple status right now. Please try again."
        onRetry={retryGates}
        title="Still preparing your invite space"
      />
    );
  }

  if (coupleGate.state.status === "paired") {
    return <Redirect href="/(couple)" />;
  }

  const isWaitingForPartner = coupleGate.state.status === "waiting";

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    >
      <Stack.Protected guard={!isWaitingForPartner}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create" />
        <Stack.Screen name="accept" />
        <Stack.Screen name="[code]" />
      </Stack.Protected>
      <Stack.Protected guard={isWaitingForPartner}>
        <Stack.Screen name="waiting" />
      </Stack.Protected>
    </Stack>
  );
}

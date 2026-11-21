import { Redirect, Stack } from "expo-router";

import { GateErrorScreen, GateLoadingScreen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { useRetryAppGates } from "@/features/couple/hooks/useRetryAppGates";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";
import { PartnerPresenceAlerts } from "@/features/presence/components/PartnerPresenceAlerts";
import { colors } from "@/theme/tokens";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function CoupleLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const onboardingGate = useOnboardingGate();
  const coupleGate = useActiveCoupleState();
  const retryGates = useRetryAppGates();

  if (isInitializing || onboardingGate.isLoading) {
    return <GateLoadingScreen label="Preparing your couple space..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (onboardingGate.error) {
    return (
      <GateErrorScreen
        message="We couldn't open your profile setup right now. Please try again."
        onRetry={retryGates}
        title="Still getting things ready"
      />
    );
  }

  if (onboardingGate.needsOnboarding) {
    return <Redirect href="/(onboarding)/profile" />;
  }

  if (coupleGate.isLoading || coupleGate.state.status === "loading") {
    return <GateLoadingScreen label="Preparing your couple space..." />;
  }

  if (coupleGate.error) {
    return (
      <GateErrorScreen
        message="We couldn't load your couple status right now. Please try again."
        onRetry={retryGates}
        title="Still preparing your space"
      />
    );
  }

  if (coupleGate.state.status === "none") {
    return <Redirect href="/(invite)" />;
  }

  if (coupleGate.state.status === "waiting") {
    return <Redirect href="/(invite)/waiting" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      />
      <PartnerPresenceAlerts />
    </>
  );
}

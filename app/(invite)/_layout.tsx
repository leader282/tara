import { Redirect, Stack, useSegments } from "expo-router";
import { StyleSheet } from "react-native";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";

export default function InviteLayout() {
  const segments = useSegments();
  const currentSegment = segments[segments.length - 1];
  const isWaitingRoute = currentSegment === "waiting";

  const { isAuthenticated, isInitializing } = useAuth();
  const onboardingGate = useOnboardingGate();
  const coupleGate = useActiveCoupleState();

  if (isInitializing || onboardingGate.isLoading) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Preparing your private invite space..." />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (onboardingGate.error) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="We couldn't open invite setup right now. Please try again."
          title="Couldn’t open invite flow"
        />
      </Screen>
    );
  }

  if (onboardingGate.needsOnboarding) {
    return <Redirect href="/(onboarding)/profile" />;
  }

  if (coupleGate.isLoading || coupleGate.state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Preparing your private invite space..." />
      </Screen>
    );
  }

  if (coupleGate.error) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="We couldn't load your couple status right now. Please try again."
          title="Still preparing your invite space"
        />
      </Screen>
    );
  }

  if (coupleGate.state.status === "paired") {
    return <Redirect href="/(couple)" />;
  }

  if (coupleGate.state.status === "waiting" && !isWaitingRoute) {
    return <Redirect href="/(invite)/waiting" />;
  }

  if (coupleGate.state.status === "none" && isWaitingRoute) {
    return <Redirect href="/(invite)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
  },
});

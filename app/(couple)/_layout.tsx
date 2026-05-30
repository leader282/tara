import { Redirect, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";

export default function CoupleLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const onboardingGate = useOnboardingGate();
  const coupleGate = useActiveCoupleState();

  if (isInitializing || onboardingGate.isLoading) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Preparing your couple space..." />
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
          message="We couldn't open your profile setup right now. Please try again."
          title="Still getting things ready"
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
        <LoadingState label="Preparing your couple space..." />
      </Screen>
    );
  }

  if (coupleGate.error) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="We couldn't load your couple status right now. Please try again."
          title="Still preparing your space"
        />
      </Screen>
    );
  }

  if (coupleGate.state.status === "none") {
    return <Redirect href="/(invite)" />;
  }

  if (coupleGate.state.status === "waiting") {
    return <Redirect href="/(invite)/waiting" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
  },
});

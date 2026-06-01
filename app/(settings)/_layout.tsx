import { Redirect, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";

export default function SettingsLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const onboardingGate = useOnboardingGate();

  if (isInitializing || onboardingGate.isLoading) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading settings..." />
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
          message="We couldn't load your profile state right now. Please try again."
          title="Settings unavailable"
        />
      </Screen>
    );
  }

  if (onboardingGate.needsOnboarding) {
    return <Redirect href="/(onboarding)/profile" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
  },
});

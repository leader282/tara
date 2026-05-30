import { Redirect, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";

export default function OnboardingLayout() {
  const { isAuthenticated } = useAuth();
  const { isLoading, needsOnboarding, error } = useOnboardingGate();

  if (isLoading) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Setting up your Tara onboarding..." />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (error) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="We couldn't load your onboarding details right now. Please try again."
          title="Couldn’t open onboarding"
        />
      </Screen>
    );
  }

  if (!needsOnboarding) {
    return <Redirect href="/(protected)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
  },
});

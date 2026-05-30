import { Redirect } from "expo-router";
import { StyleSheet } from "react-native";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboardingGate } from "@/features/onboarding/hooks/useOnboardingGate";

export default function IndexScreen() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { isLoading, needsOnboarding, error } = useOnboardingGate();

  if (isInitializing || (isAuthenticated && isLoading)) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading Tara..." />
      </Screen>
    );
  }

  if (isAuthenticated) {
    if (error) {
      return (
        <Screen contentContainerStyle={styles.loading}>
          <ErrorState
            message="We couldn't open your setup right now. Please try again in a moment."
            title="Still getting things ready"
          />
        </Screen>
      );
    }

    if (needsOnboarding) {
      return <Redirect href="/(onboarding)/profile" />;
    }

    return <Redirect href="/(protected)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
  },
});

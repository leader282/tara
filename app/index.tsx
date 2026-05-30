import { Redirect } from "expo-router";
import { StyleSheet } from "react-native";

import { LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function IndexScreen() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading Tara..." />
      </Screen>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(protected)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
  },
});

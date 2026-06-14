import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { completeAuthRedirect } from "@/features/auth/api/authApi";

const confirmationErrorMessage =
  "We couldn't confirm your email from this link. Open the latest confirmation email or sign in again.";

export default function AuthCallbackScreen() {
  const linkingUrl = Linking.useLinkingURL();
  const handledUrlRef = useRef<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const completeConfirmation = async () => {
      const callbackUrl = linkingUrl ?? Linking.getLinkingURL();

      if (!callbackUrl || handledUrlRef.current === callbackUrl) {
        return;
      }

      handledUrlRef.current = callbackUrl;

      try {
        await completeAuthRedirect(callbackUrl);
        if (isMounted) {
          router.replace("/");
        }
      } catch {
        if (isMounted) {
          setErrorMessage(confirmationErrorMessage);
        }
      }
    };

    void completeConfirmation();

    return () => {
      isMounted = false;
    };
  }, [linkingUrl]);

  if (errorMessage) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message={errorMessage}
          onRetry={() => router.replace("/(auth)/sign-in")}
          retryLabel="Back to sign in"
          title="Email confirmation failed"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.centered}>
      <LoadingState label="Confirming your email..." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
  },
});

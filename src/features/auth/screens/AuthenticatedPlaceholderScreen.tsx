import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toAuthActionMessage } from "@/lib/errors/authErrorMessages";
import { spacing } from "@/theme/tokens";

export function AuthenticatedPlaceholderScreen() {
  const { signOut } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await signOut();
    } catch (error) {
      setSubmitError(toAuthActionMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.cardContent}>
          <AppText variant="subtitle">You&apos;re signed in to Tara.</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Profile setup comes next.
          </AppText>

          {submitError ? (
            <AppText color="danger" variant="caption">
              {submitError}
            </AppText>
          ) : null}

          <Button
            disabled={isSubmitting}
            loading={isSubmitting}
            onPress={handleSignOut}
            title="Sign out"
            variant="secondary"
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  cardContent: {
    gap: spacing.lg,
  },
});

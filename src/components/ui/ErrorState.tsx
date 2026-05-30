import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { defaultErrorMessage } from "@/lib/errors/errorMessages";
import { spacing } from "@/theme/tokens";

type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message = defaultErrorMessage,
  retryLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText color="textSecondary" variant="bodyMuted">
        {message}
      </AppText>
      {onRetry ? (
        <View style={styles.action}>
          <Button onPress={onRetry} title={retryLabel} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 160,
  },
});

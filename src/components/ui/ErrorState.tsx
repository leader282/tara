import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { defaultErrorMessage } from "@/lib/errors/errorMessages";
import { colors, radii, spacing } from "@/theme/tokens";

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
    <View accessibilityRole="alert" style={styles.container}>
      <View style={styles.iconWell}>
        <Icon color="danger" name="cloud-offline-outline" size={26} />
      </View>
      <View style={styles.copy}>
        <AppText align="center" variant="subtitle">
          {title}
        </AppText>
        <AppText align="center" color="textSecondary" variant="bodyMuted">
          {message}
        </AppText>
      </View>
      {onRetry ? (
        <Button
          icon="refresh"
          onPress={onRetry}
          size="md"
          style={styles.action}
          title={retryLabel}
          variant="outline"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  iconWell: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.pill,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  copy: {
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.xs,
    minWidth: 160,
  },
});

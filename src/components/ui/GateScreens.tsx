import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { BrandMark } from "@/components/ui/BrandMark";
import { ErrorState } from "@/components/ui/ErrorState";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/theme/tokens";

type GateLoadingScreenProps = {
  label: string;
};

export function GateLoadingScreen({ label }: GateLoadingScreenProps) {
  return (
    <Screen centered>
      <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.container}>
        <BrandMark size={64} />
        <View style={styles.copy}>
          <AppText align="center" color="textSecondary" variant="bodyMuted">
            {label}
          </AppText>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      </View>
    </Screen>
  );
}

type GateErrorScreenProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function GateErrorScreen({ title, message, onRetry, retryLabel }: GateErrorScreenProps) {
  return (
    <Screen centered>
      <ErrorState message={message} onRetry={onRetry} retryLabel={retryLabel} title={title} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xl,
  },
  copy: {
    alignItems: "center",
    gap: spacing.md,
  },
});

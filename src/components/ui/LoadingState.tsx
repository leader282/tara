import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/theme/tokens";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="small" />
      <AppText color="textSecondary" variant="bodyMuted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
});

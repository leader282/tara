import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme/tokens";

type TimelineLoadingFooterProps = {
  visible: boolean;
};

export function TimelineLoadingFooter({ visible }: TimelineLoadingFooterProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="small" />
      <AppText color="textSecondary" variant="caption">
        Loading more moments...
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    paddingTop: spacing.md,
  },
});

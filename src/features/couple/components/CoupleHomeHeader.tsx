import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type CoupleHomeHeaderProps = {
  partnerDisplayName: string;
};

export function CoupleHomeHeader({ partnerDisplayName }: CoupleHomeHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="title">Your private space</AppText>
      <AppText color="textSecondary" variant="bodyMuted">
        You and {partnerDisplayName} can stay close, even while life happens in different places.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});

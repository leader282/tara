import { StyleSheet, View } from "react-native";

import { AppText, Button, InlineMessage } from "@/components/ui";
import { CapsuleHero } from "@/features/capsules/components/CapsuleHero";
import type { MemoryCapsule } from "@/features/capsules/types";
import { spacing } from "@/theme/tokens";

type CapsuleOpenableStateProps = {
  capsule: MemoryCapsule;
  isOpening: boolean;
  errorMessage?: string | null;
  onOpenPress: () => void;
};

export function CapsuleOpenableState({
  capsule,
  isOpening,
  errorMessage,
  onOpenPress,
}: CapsuleOpenableStateProps) {
  return (
    <View style={styles.container}>
      <CapsuleHero capsule={capsule} emoji="🎁" />
      <AppText align="center" color="textSecondary" variant="bodyMuted">
        This capsule is ready when you are. Open it to see what&apos;s inside.
      </AppText>
      <Button
        disabled={isOpening}
        icon="gift"
        loading={isOpening}
        onPress={onOpenPress}
        title="Open capsule"
      />
      {errorMessage ? <InlineMessage message={errorMessage} tone="danger" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
});

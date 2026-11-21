import { StyleSheet, View } from "react-native";

import { InlineMessage } from "@/components/ui";
import { CapsuleHero } from "@/features/capsules/components/CapsuleHero";
import type { MemoryCapsule } from "@/features/capsules/types";
import { spacing } from "@/theme/tokens";

type CapsuleLockedStateProps = {
  capsule: MemoryCapsule;
};

export function CapsuleLockedState({ capsule }: CapsuleLockedStateProps) {
  return (
    <View style={styles.container}>
      <CapsuleHero capsule={capsule} emoji="🔒" />
      <InlineMessage
        icon="lock-closed"
        message="This capsule is still waiting for its day. Its note and photo stay sealed until unlock."
        tone="neutral"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
});

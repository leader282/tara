import { StyleSheet, View } from "react-native";

import { CapsuleCard } from "@/features/capsules/components/CapsuleCard";
import type { CapsuleListItem as CapsuleListItemModel } from "@/features/capsules/types";
import { spacing } from "@/theme/tokens";

type CapsuleListProps = {
  capsules: CapsuleListItemModel[];
  onCapsulePress: (capsuleId: string) => void;
};

export function CapsuleList({ capsules, onCapsulePress }: CapsuleListProps) {
  return (
    <View style={styles.container}>
      {capsules.map((capsuleItem) => (
        <CapsuleCard
          item={capsuleItem}
          key={capsuleItem.capsule.id}
          onPress={onCapsulePress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});

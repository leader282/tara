import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { CapsuleCard } from "@/features/capsules/components/CapsuleCard";
import type { CapsuleListItem as CapsuleListItemModel } from "@/features/capsules/types";
import { spacing } from "@/theme/tokens";

type CapsuleListProps = {
  capsules: CapsuleListItemModel[];
  onCapsulePress: (capsuleId: string) => void;
};

const SECTIONS: { title: string; matches: (item: CapsuleListItemModel) => boolean }[] = [
  { title: "Ready to open", matches: (item) => item.status === "openable" },
  {
    title: "Waiting for their day",
    matches: (item) => item.status !== "openable" && item.status !== "opened",
  },
  { title: "Opened together", matches: (item) => item.status === "opened" },
];

export function CapsuleList({ capsules, onCapsulePress }: CapsuleListProps) {
  return (
    <View style={styles.container}>
      {SECTIONS.map((section) => {
        const sectionItems = capsules.filter(section.matches);
        if (sectionItems.length === 0) {
          return null;
        }

        return (
          <View key={section.title} style={styles.section}>
            <AppText color="textSecondary" variant="overline">
              {section.title} · {sectionItems.length}
            </AppText>
            {sectionItems.map((capsuleItem) => (
              <CapsuleCard item={capsuleItem} key={capsuleItem.capsule.id} onPress={onCapsulePress} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
});

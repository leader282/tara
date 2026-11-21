import { StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type ConsequenceListProps = {
  items: string[];
};

export function ConsequenceList({ items }: ConsequenceListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Icon color="textTertiary" name="ellipse" size={6} style={styles.bullet} />
          <AppText color="textSecondary" style={styles.text} variant="caption">
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  bullet: {
    marginTop: 6,
  },
  text: {
    flex: 1,
  },
});

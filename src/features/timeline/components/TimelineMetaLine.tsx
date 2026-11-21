import { StyleSheet, View } from "react-native";

import { AppText, Icon, type IconName } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type TimelineMetaLineProps = {
  icon: IconName;
  label: string;
};

export function TimelineMetaLine({ icon, label }: TimelineMetaLineProps) {
  return (
    <View style={styles.row}>
      <Icon color="textTertiary" name={icon} size={14} />
      <AppText color="textSecondary" style={styles.label} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  label: {
    flex: 1,
  },
});

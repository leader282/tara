import { StyleSheet, View } from "react-native";

import { AppText, Card, Icon, type IconName } from "@/components/ui";
import { colors, radii, spacing, type ColorName } from "@/theme/tokens";

type ShortcutTileProps = {
  title: string;
  description: string;
  icon: IconName;
  iconColor: ColorName;
  iconBackground: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function ShortcutTile({
  title,
  description,
  icon,
  iconColor,
  iconBackground,
  accessibilityLabel,
  onPress,
}: ShortcutTileProps) {
  return (
    <Card accessibilityLabel={accessibilityLabel} onPress={onPress} padding="md" style={styles.tile}>
      <View style={styles.tileHeader}>
        <View style={[styles.iconWell, { backgroundColor: iconBackground }]}>
          <Icon color={iconColor} name={icon} size={20} />
        </View>
        <Icon color="textTertiary" name="arrow-forward" size={16} />
      </View>
      <View style={styles.tileCopy}>
        <AppText style={styles.tileTitle} variant="label">
          {title}
        </AppText>
        <AppText color="textSecondary" numberOfLines={2} variant="caption">
          {description}
        </AppText>
      </View>
    </Card>
  );
}

type HomeShortcutsProps = {
  onOpenRituals: () => void;
  onCreateCapsule: () => void;
};

export function HomeShortcuts({ onOpenRituals, onCreateCapsule }: HomeShortcutsProps) {
  return (
    <View style={styles.row}>
      <ShortcutTile
        accessibilityLabel="Open today's ritual"
        description="A small prompt for you two"
        icon="sparkles"
        iconBackground={colors.warningSoft}
        iconColor="warning"
        onPress={onOpenRituals}
        title="Today's ritual"
      />
      <ShortcutTile
        accessibilityLabel="Create a memory capsule"
        description="Save a note for a future day"
        icon="gift"
        iconBackground={colors.primarySoft}
        iconColor="primaryStrong"
        onPress={onCreateCapsule}
        title="New capsule"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    gap: spacing.md,
  },
  tileHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconWell: {
    alignItems: "center",
    borderRadius: radii.sm,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  tileCopy: {
    gap: 2,
  },
  tileTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
});

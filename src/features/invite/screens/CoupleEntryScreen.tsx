import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, BrandMark, Button, Card, Icon, type IconName, Screen } from "@/components/ui";
import { colors, radii, spacing, type ColorName } from "@/theme/tokens";

type ChoiceCardProps = {
  icon: IconName;
  iconColor: ColorName;
  iconBackground: string;
  title: string;
  description: string;
  actionLabel: string;
  actionVariant: "primary" | "outline";
  onPress: () => void;
};

function ChoiceCard({
  icon,
  iconColor,
  iconBackground,
  title,
  description,
  actionLabel,
  actionVariant,
  onPress,
}: ChoiceCardProps) {
  return (
    <Card>
      <View style={styles.choice}>
        <View style={styles.choiceHeader}>
          <View style={[styles.choiceIcon, { backgroundColor: iconBackground }]}>
            <Icon color={iconColor} name={icon} size={22} />
          </View>
          <View style={styles.choiceCopy}>
            <AppText variant="subtitle">{title}</AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              {description}
            </AppText>
          </View>
        </View>
        <Button onPress={onPress} title={actionLabel} variant={actionVariant} />
      </View>
    </Card>
  );
}

export function CoupleEntryScreen() {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <BrandMark size={56} />
        <AppText accessibilityRole="header" align="center" variant="title">
          Create your private space for two
        </AppText>
        <AppText align="center" color="textSecondary" variant="bodyMuted">
          Tara works by invite only. Only your partner with the invite code can join your couple
          space.
        </AppText>
      </View>

      <ChoiceCard
        actionLabel="Create our space"
        actionVariant="primary"
        description="Start your couple space and generate an invite code for your partner."
        icon="sparkles"
        iconBackground={colors.primarySoft}
        iconColor="primaryStrong"
        onPress={() => router.push("/(invite)/create")}
        title="Create our private space"
      />

      <ChoiceCard
        actionLabel="Join with code"
        actionVariant="outline"
        description="If your partner already created your space, enter their invite code to join."
        icon="key-outline"
        iconBackground={colors.infoSoft}
        iconColor="info"
        onPress={() => router.push("/(invite)/accept")}
        title="Join with an invite code"
      />

      <Button
        icon="settings-outline"
        onPress={() => router.push("/(settings)")}
        title="Open settings"
        variant="ghost"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  choice: {
    gap: spacing.lg,
  },
  choiceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  choiceIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  choiceCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});

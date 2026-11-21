import { StyleSheet, View } from "react-native";

import { AppText, IconButton } from "@/components/ui";
import { getDayPeriod } from "@/lib/dates/timezone";
import { spacing } from "@/theme/tokens";

type HomeHeaderProps = {
  displayName: string;
  onOpenSettings: () => void;
};

const GREETING_BY_PERIOD = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Good night",
} as const;

export function HomeHeader({ displayName, onOpenSettings }: HomeHeaderProps) {
  const greeting = GREETING_BY_PERIOD[getDayPeriod(new Date().getHours())];
  const firstName = displayName.trim().split(/\s+/)[0] || displayName;

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <AppText color="primary" variant="overline">
          Your private space
        </AppText>
        <AppText accessibilityRole="header" numberOfLines={2} variant="title">
          {greeting}, {firstName}
        </AppText>
      </View>
      <IconButton
        accessibilityLabel="Settings"
        icon="settings-outline"
        onPress={onOpenSettings}
        variant="surface"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});

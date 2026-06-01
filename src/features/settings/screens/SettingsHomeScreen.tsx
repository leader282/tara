import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { Screen } from "@/components/ui";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { CoupleStatusCard } from "@/features/settings/components/CoupleStatusCard";
import { SettingsRow } from "@/features/settings/components/SettingsRow";
import { SettingsSection } from "@/features/settings/components/SettingsSection";
import { spacing } from "@/theme/tokens";

export function SettingsHomeScreen() {
  const router = useRouter();
  const coupleGate = useActiveCoupleState();
  const isPaired = coupleGate.state.status === "paired";
  const coupleStatus =
    coupleGate.state.status === "loading" ? "none" : coupleGate.state.status;

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <SettingsSection
        description="Choose what feels calm, private, and supportive."
        title="Settings"
      >
        <SettingsRow
          description="Display name, timezone, and personal profile details."
          onPress={() => router.push("/(settings)/profile")}
          title="Profile"
        />
        <SettingsRow
          description="Emotional tone, preferred love signals, and notification tone."
          onPress={() => router.push("/(settings)/emotional")}
          title="Emotional preferences"
        />
        <SettingsRow
          description="Set rest hours Tara should respect."
          onPress={() => router.push("/(settings)/quiet-hours")}
          title="Quiet hours"
        />
        <SettingsRow
          description="Choose which gentle reminders you want."
          onPress={() => router.push("/(settings)/notifications")}
          title="Notifications"
        />
      </SettingsSection>

      <CoupleStatusCard status={coupleStatus} />

      <SettingsSection
        description="Shared options for your couple space."
        title="Couple"
      >
        <SettingsRow
          description={
            isPaired
              ? "Anniversary and shared ritual rhythm."
              : "Available after pairing."
          }
          disabled={!isPaired}
          onPress={
            isPaired
              ? () => router.push("/(settings)/couple")
              : undefined
          }
          title="Couple settings"
        />
      </SettingsSection>

      <SettingsSection description="Privacy controls and account safety." title="Privacy and account">
        <SettingsRow
          description="How Tara protects your private space for two."
          onPress={() => router.push("/(settings)/privacy")}
          title="Privacy center"
        />
        <SettingsRow
          description="Unpair, request data export, or request account deletion."
          onPress={() => router.push("/(settings)/account")}
          title="Account and safety"
        />
      </SettingsSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
});

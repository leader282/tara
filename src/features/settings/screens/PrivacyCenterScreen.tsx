import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Screen } from "@/components/ui";
import { PrivacyExplanationCard } from "@/features/settings/components/PrivacyExplanationCard";
import { spacing } from "@/theme/tokens";

export function PrivacyCenterScreen() {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Privacy center</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Tara is built as a private emotional space for exactly two partners.
        </AppText>
      </View>

      <PrivacyExplanationCard
        points={[
          "No public profiles, no followers, and no discovery feed.",
          "No exact GPS tracking in the MVP.",
          "No last-seen or read receipts by default.",
          "Only your partner can access shared couple-space content.",
        ]}
        title="How your space stays private"
      />

      <PrivacyExplanationCard
        points={[
          "Ritual responses reveal only after both partners complete.",
          "Memory capsule contents unlock only after the unlock time.",
          "Media remains private and context-aware inside your couple space.",
          "Notifications avoid sensitive lock-screen content.",
        ]}
        title="How shared content is protected"
      />

      <PrivacyExplanationCard
        points={[
          "AI does not read private memories in the MVP.",
          "Data export and account deletion controls are available in account safety.",
          "Deletion requests are processed server-side and may be scheduled.",
        ]}
        title="Your privacy controls"
      />

      <Button
        onPress={() => router.push("/(settings)/account")}
        title="Open account and safety controls"
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
});

import { useRouter } from "expo-router";

import { useGoBack } from "@/components/navigation/useGoBack";
import { Button, Screen } from "@/components/ui";
import { PrivacyExplanationCard } from "@/features/settings/components/PrivacyExplanationCard";

export function PrivacyCenterScreen() {
  const router = useRouter();
  const goBack = useGoBack("/(settings)");

  return (
    <Screen
      onBack={goBack}
      scroll
      subtitle="Tara is built as a private emotional space for exactly two partners."
      title="Privacy center"
    >
      <PrivacyExplanationCard
        icon="eye-off-outline"
        points={[
          "No public profiles, no followers, and no discovery feed.",
          "No exact GPS tracking in the MVP.",
          "No last-seen or read receipts by default.",
          "Only your partner can access shared couple-space content.",
        ]}
        title="How your space stays private"
      />

      <PrivacyExplanationCard
        icon="lock-closed-outline"
        points={[
          "Ritual responses reveal only after both partners complete.",
          "Memory capsule contents unlock only after the unlock time.",
          "Media remains private and context-aware inside your couple space.",
          "Notifications say what your partner shared, never your notes, answers, or photos.",
        ]}
        title="How shared content is protected"
      />

      <PrivacyExplanationCard
        icon="options-outline"
        points={[
          "AI does not read private memories in the MVP.",
          "Data export and account deletion controls are available in account safety.",
          "Deletion requests are processed server-side and may be scheduled.",
        ]}
        title="Your privacy controls"
      />

      <Button
        iconRight="arrow-forward"
        onPress={() => router.push("/(settings)/account")}
        title="Open account and safety controls"
        variant="outline"
      />
    </Screen>
  );
}

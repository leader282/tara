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
          "Tara never tracks your location.",
          "No last-seen or read receipts by default.",
          "Only your partner can access shared couple-space content.",
        ]}
        title="How your space stays private"
      />

      <PrivacyExplanationCard
        icon="lock-closed-outline"
        points={[
          "Ritual answers appear only after you've both answered.",
          "Capsules stay sealed until the time you chose.",
          "Photos and videos stay private to your couple space.",
          "Notifications say what your partner shared, never your notes, answers, or photos.",
        ]}
        title="How shared content is protected"
      />

      <PrivacyExplanationCard
        icon="options-outline"
        points={[
          "No AI reads your private memories.",
          "Tara keeps your 5 most recent rituals and the last 7 days of your timeline, and deletes older ones.",
          "You can export your data or delete your account in Account and safety. Deletion takes a little time to finish.",
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

import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { spacing } from "@/theme/tokens";

export function CoupleEntryScreen() {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title">Create your private space for two</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Tara works by invite only. Only your partner with the invite code can join your couple
          space.
        </AppText>
      </View>

      <Card>
        <View style={styles.choice}>
          <AppText variant="subtitle">Create our private space</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Start your couple space and generate an invite code for your partner.
          </AppText>
          <Button onPress={() => router.push("/(invite)/create")} title="Create our space" />
        </View>
      </Card>

      <Card>
        <View style={styles.choice}>
          <AppText variant="subtitle">Join with an invite code</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            If your partner already created your space, enter their invite code to join.
          </AppText>
          <Button
            onPress={() => router.push("/(invite)/accept")}
            title="Join with code"
            variant="secondary"
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
  choice: {
    gap: spacing.md,
  },
});

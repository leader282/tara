import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { spacing } from "@/theme/tokens";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <Screen contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.body}>
            <AppText variant="subtitle">Page not found</AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              This screen does not exist in Tara yet.
            </AppText>
            <Link asChild href="/">
              <Button onPress={() => undefined} title="Back to home" variant="secondary" />
            </Link>
          </View>
        </Card>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  body: {
    gap: spacing.md,
  },
});

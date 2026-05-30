import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type AuthFooterLinkProps = {
  prompt: string;
  linkLabel: string;
  href: Href;
};

export function AuthFooterLink({ prompt, linkLabel, href }: AuthFooterLinkProps) {
  return (
    <View style={styles.container}>
      <AppText color="textSecondary" variant="bodyMuted">
        {prompt}
      </AppText>
      <Link asChild href={href}>
        <Pressable accessibilityRole="link">
          <AppText color="primary" variant="body">
            {linkLabel}
          </AppText>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
});

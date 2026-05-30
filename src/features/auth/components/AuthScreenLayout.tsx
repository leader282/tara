import { type PropsWithChildren, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Card, Screen } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type AuthScreenLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenLayoutProps) {
  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">{title}</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          {subtitle}
        </AppText>
      </View>

      <Card>
        <View style={styles.cardContent}>{children}</View>
      </Card>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    justifyContent: "center",
    paddingVertical: spacing["2xl"],
  },
  header: {
    gap: spacing.sm,
  },
  cardContent: {
    gap: spacing.lg,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
});

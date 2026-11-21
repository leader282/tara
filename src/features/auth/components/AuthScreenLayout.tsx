import { type PropsWithChildren, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, BrandMark, Card, Screen } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type AuthScreenLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

export function AuthScreenLayout({ title, subtitle, children, footer }: AuthScreenLayoutProps) {
  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.brand}>
        <BrandMark size={60} />
        <AppText style={styles.wordmark} variant="display">
          Tara
        </AppText>
        <AppText color="textSecondary" variant="caption">
          A private space for two
        </AppText>
      </View>

      <View style={styles.header}>
        <AppText accessibilityRole="header" align="center" variant="title">
          {title}
        </AppText>
        <AppText align="center" color="textSecondary" variant="bodyMuted">
          {subtitle}
        </AppText>
      </View>

      <Card padding="lg">
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
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  wordmark: {
    marginTop: spacing.xs,
  },
  header: {
    gap: spacing.sm,
  },
  cardContent: {
    gap: spacing.lg,
  },
  footer: {
    alignItems: "center",
  },
});

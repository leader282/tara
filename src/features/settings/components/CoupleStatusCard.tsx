import { StyleSheet, View } from "react-native";

import { AppText, Badge, type BadgeTone, Card, Icon, type IconName } from "@/components/ui";
import { colors, radii, spacing, type ColorName } from "@/theme/tokens";

type CoupleStatus = "none" | "waiting" | "paired";

type CoupleStatusCardProps = {
  status: CoupleStatus;
  partnerDisplayName?: string | null;
};

const copyByStatus: Record<
  CoupleStatus,
  {
    title: string;
    description: string;
    badge: string;
    tone: BadgeTone;
    icon: IconName;
    iconColor: ColorName;
    iconBackground: string;
  }
> = {
  none: {
    title: "Not paired yet",
    description: "Couple settings appear once you pair with your partner.",
    badge: "Not paired",
    tone: "neutral",
    icon: "person-outline",
    iconColor: "textSecondary",
    iconBackground: colors.surfaceMuted,
  },
  waiting: {
    title: "Waiting for your partner",
    description: "Couple settings appear once your partner joins with your invite.",
    badge: "Waiting",
    tone: "warning",
    icon: "hourglass-outline",
    iconColor: "warning",
    iconBackground: colors.warningSoft,
  },
  paired: {
    title: "Paired",
    description: "Your private space for two is active.",
    badge: "Paired",
    tone: "success",
    icon: "heart",
    iconColor: "primaryStrong",
    iconBackground: colors.primarySoft,
  },
};

// When paired, the title already says so; the badge only labels the in-between states.
export function CoupleStatusCard({ status, partnerDisplayName }: CoupleStatusCardProps) {
  const copy = copyByStatus[status];
  const isPairedWithName = status === "paired" && Boolean(partnerDisplayName);
  const title = isPairedWithName ? `Paired with ${partnerDisplayName}` : copy.title;

  return (
    <Card padding="md">
      <View style={styles.container}>
        <View style={[styles.iconWell, { backgroundColor: copy.iconBackground }]}>
          <Icon color={copy.iconColor} name={copy.icon} size={20} />
        </View>
        <View style={styles.copy}>
          <AppText style={styles.title} variant="label">
            {title}
          </AppText>
          <AppText color="textSecondary" variant="caption">
            {copy.description}
          </AppText>
        </View>
        {status === "paired" ? null : <Badge label={copy.badge} tone={copy.tone} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconWell: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
});

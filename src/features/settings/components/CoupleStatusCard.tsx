import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type CoupleStatus = "none" | "waiting" | "paired";

type CoupleStatusCardProps = {
  status: CoupleStatus;
};

const copyByStatus: Record<CoupleStatus, { title: string; description: string }> = {
  none: {
    title: "No active couple yet",
    description: "You can still manage your personal settings while your couple space is not active.",
  },
  waiting: {
    title: "Invite sent, waiting for pairing",
    description: "Personal settings are available now. Couple-shared settings unlock after pairing.",
  },
  paired: {
    title: "Paired and active",
    description: "You can update both personal settings and shared couple settings.",
  },
};

export function CoupleStatusCard({ status }: CoupleStatusCardProps) {
  const copy = copyByStatus[status];

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="subtitle">{copy.title}</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          {copy.description}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});

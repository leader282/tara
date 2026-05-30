import { StyleSheet, View } from "react-native";

import { AppText, Button, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/dates/format";
import { spacing } from "@/theme/tokens";

type InviteCodeCardProps = {
  inviteCode: string;
  expiresAt?: string | null;
  onSharePress: () => void;
  isSharing?: boolean;
};

function formatExpiry(expiresAt?: string | null): string | null {
  if (!expiresAt) {
    return null;
  }

  const parsedDate = new Date(expiresAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return formatDateTime(parsedDate);
}

export function InviteCodeCard({
  inviteCode,
  expiresAt,
  onSharePress,
  isSharing = false,
}: InviteCodeCardProps) {
  const formattedExpiry = formatExpiry(expiresAt);

  return (
    <Card>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="subtitle">Your invite code</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Share this with your partner so only they can join your private space.
          </AppText>
        </View>

        <View style={styles.codeBlock}>
          <AppText variant="title">{inviteCode}</AppText>
        </View>

        {formattedExpiry ? (
          <AppText color="textSecondary" variant="caption">
            Expires: {formattedExpiry}
          </AppText>
        ) : null}

        <Button
          loading={isSharing}
          onPress={onSharePress}
          title="Share invite"
          variant="secondary"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  codeBlock: {
    alignItems: "center",
  },
});

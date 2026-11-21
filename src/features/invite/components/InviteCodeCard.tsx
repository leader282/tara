import { StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/dates/format";
import { colors, radii, spacing } from "@/theme/tokens";
import { fontFamilies } from "@/theme/typography";

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
          <AppText
            accessibilityHint="Long-press to copy"
            accessibilityLabel={`Invite code ${inviteCode}`}
            align="center"
            selectable
            style={styles.code}
          >
            {inviteCode}
          </AppText>
        </View>

        {formattedExpiry ? (
          <Badge icon="time-outline" label={`Expires ${formattedExpiry}`} style={styles.expiry} />
        ) : null}

        <Button
          icon="share-outline"
          loading={isSharing}
          onPress={onSharePress}
          title="Share invite"
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
    backgroundColor: colors.primarySoft,
    borderColor: "#EBC9C2",
    borderRadius: radii.md,
    borderStyle: "dashed",
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  code: {
    color: colors.primaryStrong,
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    letterSpacing: 1.5,
    lineHeight: 30,
  },
  expiry: {
    alignSelf: "center",
  },
});

import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";

import { AppText, EmptyState, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { InviteCodeCard } from "@/features/invite/components/InviteCodeCard";
import { InviteErrorMessage } from "@/features/invite/components/InviteErrorMessage";
import {
  buildInviteMessage,
  normalizeInviteCode,
} from "@/features/invite/api/inviteApi";
import { useActiveInvite } from "@/features/invite/hooks/useActiveInvite";
import { queryKeys } from "@/lib/query/queryKeys";
import { buildInviteLink } from "@/lib/sharing/inviteShare";
import { spacing } from "@/theme/tokens";

function toShareErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.toLowerCase().includes("cancelled")) {
    return "";
  }

  return "We couldn't open share options right now. Please try again.";
}

export function InvitePartnerScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { state, isLoading, error } = useActiveCoupleState();
  const waitingCoupleId = state.status === "waiting" ? state.couple.id : null;
  const inviteQuery = useActiveInvite(waitingCoupleId);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  if (isLoading || state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading your invite..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message="We couldn't load your invite details right now. Please try again."
          onRetry={() => {
            if (!user?.id) {
              return;
            }

            void queryClient.invalidateQueries({
              queryKey: queryKeys.couple.activeState(user.id),
            });
          }}
          title="Couldn’t load invite"
        />
      </Screen>
    );
  }

  if (state.status === "paired") {
    return <Redirect href="/(couple)" />;
  }

  if (state.status === "none") {
    return <Redirect href="/(invite)" />;
  }

  const invite = inviteQuery.data ?? state.invite ?? null;

  const handleShareInvite = async () => {
    if (!invite) {
      return;
    }

    try {
      setShareError(null);
      setIsSharing(true);
      const normalizedCode = normalizeInviteCode(invite.invite_code);
      const inviteLink = buildInviteLink(normalizedCode) ?? undefined;
      const shareMessage = buildInviteMessage(normalizedCode, inviteLink);
      await Share.share({ message: shareMessage });
    } catch (error) {
      const friendlyError = toShareErrorMessage(error);
      setShareError(friendlyError || null);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title">Invite your partner</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Your couple home unlocks as soon as your partner joins with this invite.
        </AppText>
      </View>

      {inviteQuery.isLoading && !invite ? <LoadingState label="Checking your active invite..." /> : null}

      {invite ? (
        <InviteCodeCard
          expiresAt={invite.expires_at}
          inviteCode={invite.invite_code}
          isSharing={isSharing}
          onSharePress={handleShareInvite}
        />
      ) : (
        <EmptyState
          actionLabel="Refresh invite"
          description="We couldn't find an active invite right now. Try refreshing, then create a new one if needed."
          onActionPress={() => {
            if (!waitingCoupleId) {
              return;
            }

            void queryClient.invalidateQueries({
              queryKey: queryKeys.invite.active(waitingCoupleId),
            });
          }}
          title="No active invite yet"
        />
      )}

      <InviteErrorMessage message={shareError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    justifyContent: "center",
  },
  centered: {
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
});

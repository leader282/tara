import { useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Share, StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
} from "@/components/ui";
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
import { colors, radii, spacing } from "@/theme/tokens";

function toShareErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.toLowerCase().includes("cancelled")) {
    return "";
  }

  return "We couldn't open share options right now. Please try again.";
}

function WaitingIndicator() {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.waitingRow}>
      <View style={styles.dotWrap}>
        <Animated.View
          style={[
            styles.dotHalo,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
            },
          ]}
        />
        <View style={styles.dot} />
      </View>
      <AppText color="textSecondary" style={styles.waitingText} variant="bodyMuted">
        Waiting for your partner to join. Your couple home unlocks the moment they do.
      </AppText>
    </View>
  );
}

export function InvitePartnerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { state, isLoading, error } = useActiveCoupleState({ pollWhileWaiting: true });
  const waitingCoupleId = state.status === "waiting" ? state.couple.id : null;
  const inviteQuery = useActiveInvite(waitingCoupleId);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const refreshCoupleState = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.activeState(user.id),
    });
  };

  if (isLoading || state.status === "loading") {
    return (
      <Screen centered>
        <LoadingState label="Loading your invite..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen centered>
        <ErrorState
          message="We couldn't load your invite details right now. Please try again."
          onRetry={refreshCoupleState}
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
    } catch (shareFailure) {
      const friendlyError = toShareErrorMessage(shareFailure);
      setShareError(friendlyError || null);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Screen
      scroll
      subtitle="Your couple home unlocks as soon as your partner joins with this invite."
      title="Invite your partner"
    >
      {inviteQuery.isLoading && !invite ? <LoadingState label="Checking your active invite..." /> : null}

      {invite ? (
        <InviteCodeCard
          expiresAt={invite.expires_at}
          inviteCode={invite.invite_code}
          isSharing={isSharing}
          onSharePress={handleShareInvite}
        />
      ) : (
        <Card>
          <EmptyState
            actionLabel="Refresh invite"
            actionVariant="outline"
            description="We couldn't find an active invite right now. Try refreshing, then create a new one if needed."
            icon="key-outline"
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
        </Card>
      )}

      <InviteErrorMessage message={shareError} />

      <Card variant="muted">
        <View style={styles.waitingCard}>
          <WaitingIndicator />
          <Button
            icon="refresh"
            onPress={refreshCoupleState}
            size="md"
            title="Check again"
            variant="outline"
          />
        </View>
      </Card>

      <Button
        icon="settings-outline"
        onPress={() => router.push("/(settings)")}
        title="Open settings"
        variant="ghost"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  waitingCard: {
    gap: spacing.lg,
  },
  waitingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  dotWrap: {
    alignItems: "center",
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  dotHalo: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 12,
    position: "absolute",
    width: 12,
  },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 10,
    width: 10,
  },
  waitingText: {
    flex: 1,
  },
});

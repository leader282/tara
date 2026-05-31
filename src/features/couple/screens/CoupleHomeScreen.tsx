import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { AppText, Button, Card, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toAuthActionMessage } from "@/lib/errors/authErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";
import { CoupleHomeEmptyState } from "@/features/couple/components/CoupleHomeEmptyState";
import { CoupleHomeHeader } from "@/features/couple/components/CoupleHomeHeader";
import { PartnerCard } from "@/features/couple/components/PartnerCard";
import { PartnerLocalTimeCard } from "@/features/couple/components/PartnerLocalTimeCard";
import { ReunionCountdownCard } from "@/features/couple/components/ReunionCountdownCard";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { IncomingPulseToast } from "@/features/presence/components/IncomingPulseToast";
import { PresencePulsePanel } from "@/features/presence/components/PresencePulsePanel";
import { RecentPulsesCard } from "@/features/presence/components/RecentPulsesCard";
import { useIncomingPulseToast } from "@/features/presence/hooks/useIncomingPulseToast";
import { usePresenceRealtime } from "@/features/presence/hooks/usePresenceRealtime";
import { useRecentPresencePulses } from "@/features/presence/hooks/useRecentPresencePulses";

export function CoupleHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const coupleHome = useCoupleHome();
  const incomingPulseToast = useIncomingPulseToast();
  const pairedCoupleId =
    coupleHome.state.status === "paired" ? coupleHome.state.data.couple.id : null;
  const partnerDisplayName =
    coupleHome.state.status === "paired" ? coupleHome.state.data.partnerProfile.display_name : "Partner";
  const recentPresencePulses = useRecentPresencePulses(pairedCoupleId);

  usePresenceRealtime(
    pairedCoupleId,
    user?.id,
    incomingPulseToast.showIncomingPulse,
    coupleHome.state.status === "paired"
  );

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleEditMeetup = () => {
    router.push("/(couple)/edit-meetup");
  };

  const handleOpenRituals = () => {
    router.push("/(couple)/rituals");
  };

  const handleOpenCapsules = () => {
    router.push("/(couple)/capsules");
  };

  const handleOpenTimeline = () => {
    router.push("/(couple)/timeline");
  };

  const handleRetry = () => {
    if (!user?.id) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleSignOut = async () => {
    try {
      setSignOutError(null);
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      setSignOutError(toAuthActionMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <LoadingState label="Loading your couple home..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't load your couple home right now."}
          onRetry={handleRetry}
          title="Couldn’t open your space"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return (
      <Screen contentContainerStyle={styles.content}>
        <CoupleHomeEmptyState
          actionLabel="Open invite setup"
          description="Your couple space is not active yet. You can continue from the invite flow."
          onActionPress={() => router.replace("/(invite)")}
          title="Your couple home is waiting"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "waiting") {
    return (
      <Screen contentContainerStyle={styles.content}>
        <CoupleHomeEmptyState
          actionLabel="View invite"
          description="Your space is ready. It unlocks fully once your partner joins."
          onActionPress={() => router.replace("/(invite)/waiting")}
          title="Waiting for your partner"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "invariant_error") {
    return (
      <Screen contentContainerStyle={styles.centered}>
        <ErrorState
          message="We found an unexpected couple setup issue. Please try again in a moment."
          onRetry={handleRetry}
          title="Couple setup needs attention"
        />
      </Screen>
    );
  }

  const coupleHomeData = coupleHome.state.data;

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <IncomingPulseToast
        partnerDisplayName={partnerDisplayName}
        pulse={incomingPulseToast.pulse}
        visible={incomingPulseToast.isVisible}
      />
      <CoupleHomeHeader partnerDisplayName={coupleHomeData.partnerProfile.display_name} />
      <PartnerCard partnerProfile={coupleHomeData.partnerProfile} />
      <PartnerLocalTimeCard partnerProfile={coupleHomeData.partnerProfile} />
      <ReunionCountdownCard
        nextMeetupAt={coupleHomeData.nextMeetupAt}
        nextMeetupLocation={coupleHomeData.nextMeetupLocation}
        onEditMeetup={handleEditMeetup}
      />
      <Card>
        <View style={styles.ritualEntryCard}>
          <View style={styles.ritualEntryHeader}>
            <AppText variant="subtitle">Today&apos;s ritual</AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              Open your shared prompt whenever it feels right.
            </AppText>
          </View>
          <Button onPress={handleOpenRituals} title="Open today's ritual" variant="secondary" />
        </View>
      </Card>
      <Card>
        <View style={styles.capsuleEntryCard}>
          <View style={styles.capsuleEntryHeader}>
            <AppText variant="subtitle">Memory capsules</AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              Save a note now and open it together on a future day.
            </AppText>
          </View>
          <Button onPress={handleOpenCapsules} title="Open memory capsules" variant="secondary" />
        </View>
      </Card>
      <Card>
        <View style={styles.timelineEntryCard}>
          <View style={styles.timelineEntryHeader}>
            <AppText variant="subtitle">Timeline</AppText>
            <AppText color="textSecondary" variant="bodyMuted">
              Revisit pulses, rituals, capsules, and reunion updates in one calm feed.
            </AppText>
          </View>
          <Button onPress={handleOpenTimeline} title="Open timeline" variant="secondary" />
        </View>
      </Card>
      <PresencePulsePanel partnerDisplayName={coupleHomeData.partnerProfile.display_name} />
      <RecentPulsesCard
        currentUserId={user?.id ?? ""}
        errorMessage={recentPresencePulses.friendlyError}
        isLoading={recentPresencePulses.isLoading}
        partnerDisplayName={coupleHomeData.partnerProfile.display_name}
        pulses={recentPresencePulses.pulses}
      />

      <View style={styles.signOutSection}>
        {signOutError ? (
          <AppText color="danger" variant="caption">
            {signOutError}
          </AppText>
        ) : null}
        <Button
          disabled={isSigningOut}
          loading={isSigningOut}
          onPress={handleSignOut}
          title="Sign out"
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  centered: {
    justifyContent: "center",
  },
  ritualEntryCard: {
    gap: spacing.md,
  },
  ritualEntryHeader: {
    gap: spacing.xs,
  },
  capsuleEntryCard: {
    gap: spacing.md,
  },
  capsuleEntryHeader: {
    gap: spacing.xs,
  },
  timelineEntryCard: {
    gap: spacing.md,
  },
  timelineEntryHeader: {
    gap: spacing.xs,
  },
  signOutSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

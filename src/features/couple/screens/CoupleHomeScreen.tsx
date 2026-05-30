import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { AppText, Button, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toAuthActionMessage } from "@/lib/errors/authErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";
import { CoupleHomeEmptyState } from "@/features/couple/components/CoupleHomeEmptyState";
import { CoupleHomeHeader } from "@/features/couple/components/CoupleHomeHeader";
import { NextMeetupCard } from "@/features/couple/components/NextMeetupCard";
import { PartnerCard } from "@/features/couple/components/PartnerCard";
import { PartnerLocalTimeCard } from "@/features/couple/components/PartnerLocalTimeCard";
import { ReunionCountdownCard } from "@/features/couple/components/ReunionCountdownCard";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";

export function CoupleHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const coupleHome = useCoupleHome();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleEditMeetup = () => {
    router.push("/(couple)/edit-meetup");
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
      <CoupleHomeHeader partnerDisplayName={coupleHomeData.partnerProfile.display_name} />
      <PartnerCard partnerProfile={coupleHomeData.partnerProfile} />
      <PartnerLocalTimeCard partnerProfile={coupleHomeData.partnerProfile} />
      <ReunionCountdownCard
        nextMeetupAt={coupleHomeData.nextMeetupAt}
        nextMeetupLocation={coupleHomeData.nextMeetupLocation}
        onEditMeetup={handleEditMeetup}
      />
      <NextMeetupCard
        nextMeetupAt={coupleHomeData.nextMeetupAt}
        nextMeetupLocation={coupleHomeData.nextMeetupLocation}
        onEditMeetup={handleEditMeetup}
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
  signOutSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
import {
  AppText,
  Avatar,
  Button,
  Card,
  Icon,
  ListGroup,
  ListRow,
  Screen,
} from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { CoupleStatusCard } from "@/features/settings/components/CoupleStatusCard";
import { useSettingsProfile } from "@/features/settings/hooks/useSettingsProfile";
import { toAuthActionMessage } from "@/lib/errors/authErrorMessages";
import { spacing } from "@/theme/tokens";

export function SettingsHomeScreen() {
  const router = useRouter();
  // Not "/": inside the settings group that resolves back to this screen.
  const goBack = useGoBack("/(couple)");
  const toast = useToast();
  const { user, signOut } = useAuth();
  const settingsProfile = useSettingsProfile(user?.id);
  const coupleGate = useActiveCoupleState();
  const coupleHome = useCoupleHome();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isPaired = coupleGate.state.status === "paired";
  const coupleStatus = coupleGate.state.status === "loading" ? "none" : coupleGate.state.status;
  const partnerDisplayName =
    coupleHome.state.status === "paired" ? coupleHome.state.data.partnerProfile.display_name : null;
  const displayName = settingsProfile.data?.profile?.display_name?.trim() || "You";
  const appVersion = Constants.expoConfig?.version;

  const performSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      toast.show({ tone: "danger", title: "Couldn't sign out", message: toAuthActionMessage(error) });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out of Tara?", "Your space stays safe. You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  };

  return (
    <Screen
      onBack={goBack}
      scroll
      subtitle="Choose what feels calm, private, and supportive."
      title="Settings"
    >
      <Card
        accessibilityLabel="Edit your profile"
        onPress={() => router.push("/(settings)/profile")}
        padding="md"
      >
        <View style={styles.profileRow}>
          <Avatar name={displayName} size={52} />
          <View style={styles.profileCopy}>
            <AppText numberOfLines={1} variant="subtitle">
              {displayName}
            </AppText>
            {user?.email ? (
              <AppText color="textSecondary" numberOfLines={1} variant="caption">
                {user.email}
              </AppText>
            ) : null}
          </View>
          <Icon color="textTertiary" name="chevron-forward" size={18} />
        </View>
      </Card>

      <CoupleStatusCard partnerDisplayName={partnerDisplayName} status={coupleStatus} />

      <View style={styles.section}>
        <AppText color="textSecondary" style={styles.sectionLabel} variant="overline">
          You
        </AppText>
        <ListGroup>
          <ListRow
            description="Display name, timezone, and personal details."
            icon="person-outline"
            onPress={() => router.push("/(settings)/profile")}
            title="Profile"
          />
          <ListRow
            description="Emotional tone, love signals, and notification tone."
            icon="color-palette-outline"
            iconTone="warning"
            onPress={() => router.push("/(settings)/emotional")}
            title="Emotional preferences"
          />
          <ListRow
            description="Set rest hours Tara should respect."
            icon="moon-outline"
            iconTone="info"
            onPress={() => router.push("/(settings)/quiet-hours")}
            title="Quiet hours"
          />
          <ListRow
            description="Choose which gentle reminders you want."
            icon="notifications-outline"
            iconTone="success"
            onPress={() => router.push("/(settings)/notifications")}
            title="Notifications"
          />
        </ListGroup>
      </View>

      <View style={styles.section}>
        <AppText color="textSecondary" style={styles.sectionLabel} variant="overline">
          Couple
        </AppText>
        <ListGroup>
          <ListRow
            description={isPaired ? "Anniversary and shared ritual rhythm." : "Available after pairing."}
            disabled={!isPaired}
            icon="heart-outline"
            onPress={isPaired ? () => router.push("/(settings)/couple") : undefined}
            title="Couple settings"
          />
        </ListGroup>
      </View>

      <View style={styles.section}>
        <AppText color="textSecondary" style={styles.sectionLabel} variant="overline">
          Privacy and account
        </AppText>
        <ListGroup>
          <ListRow
            description="How Tara protects your private space for two."
            icon="shield-checkmark-outline"
            iconTone="success"
            onPress={() => router.push("/(settings)/privacy")}
            title="Privacy center"
          />
          <ListRow
            description="Unpair, request data export, or request account deletion."
            icon="lock-closed-outline"
            iconTone="neutral"
            onPress={() => router.push("/(settings)/account")}
            title="Account and safety"
          />
        </ListGroup>
      </View>

      <Button
        icon="log-out-outline"
        loading={isSigningOut}
        onPress={handleSignOut}
        title="Sign out"
        variant="outline"
      />

      {appVersion ? (
        <AppText align="center" color="textTertiary" variant="caption">
          Tara {appVersion} · Made for two
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    marginLeft: spacing.xs,
  },
});

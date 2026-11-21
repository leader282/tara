import { useCallback } from "react";

import { useRouter } from "expo-router";

import { useToast } from "@/components/feedback/ToastProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import { usePresenceRealtime } from "@/features/presence/hooks/usePresenceRealtime";
import { claimPulseAnnouncement } from "@/features/presence/services/pulseAnnouncements";
import type { RecentPresencePulse } from "@/features/presence/types";

export function PartnerPresenceAlerts() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();
  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const partnerDisplayName = pairedData?.partnerProfile.display_name ?? "Your partner";

  const showIncomingPulse = useCallback(
    (pulse: RecentPresencePulse) => {
      if (!claimPulseAnnouncement(pulse.id)) {
        return;
      }

      const option = PRESENCE_PULSE_OPTIONS[pulse.type];
      toast.show({
        tone: "love",
        emoji: option.emoji,
        title: option.receivedTitle(partnerDisplayName),
        message: pulse.optional_message ? `"${pulse.optional_message}"` : option.receivedMessage,
        actionLabel: "Reply",
        onPress: () => router.navigate("/(couple)"),
      });
    },
    [partnerDisplayName, router, toast],
  );

  usePresenceRealtime(pairedData?.couple.id, user?.id, showIncomingPulse, Boolean(pairedData));

  return null;
}

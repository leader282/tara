import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import { PulseTypeIcon } from "@/features/presence/components/PulseTypeIcon";
import type { RecentPresencePulse } from "@/features/presence/types";
import { spacing } from "@/theme/tokens";

type IncomingPulseToastProps = {
  visible: boolean;
  pulse: RecentPresencePulse | null;
  partnerDisplayName?: string;
};

function buildIncomingPulseMessage(
  pulse: RecentPresencePulse,
  partnerDisplayName: string
): string {
  switch (pulse.type) {
    case "hug":
      return `A hug from ${partnerDisplayName}`;
    case "thinking_of_you":
      return `${partnerDisplayName} is thinking of you`;
    default:
      return `${partnerDisplayName} sent ${PRESENCE_PULSE_OPTIONS[pulse.type].label.toLowerCase()}`;
  }
}

export function IncomingPulseToast({
  visible,
  pulse,
  partnerDisplayName = "Partner",
}: IncomingPulseToastProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-8));

  useEffect(() => {
    if (!pulse) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 180 : 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : -8,
        duration: visible ? 180 : 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, pulse, translateY, visible]);

  if (!pulse) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Card>
        <View style={styles.content}>
          <View style={styles.header}>
            <PulseTypeIcon compact type={pulse.type} />
            <AppText variant="body">{buildIncomingPulseMessage(pulse, partnerDisplayName)}</AppText>
          </View>
          {pulse.optional_message ? (
            <AppText color="textSecondary" variant="bodyMuted">
              {pulse.optional_message}
            </AppText>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  content: {
    gap: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
});

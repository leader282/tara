import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { spacing } from "@/theme/tokens";

type TimelinePresenceItemProps = {
  item: TimelineDisplayItem;
};

function formatPulseTypeLabel(value: string): string {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getPulseLabel(pulseType: string | undefined): string | null {
  if (!pulseType) {
    return null;
  }

  if (pulseType in PRESENCE_PULSE_OPTIONS) {
    const typedPulseType = pulseType as keyof typeof PRESENCE_PULSE_OPTIONS;
    return PRESENCE_PULSE_OPTIONS[typedPulseType].label;
  }

  return formatPulseTypeLabel(pulseType);
}

export function TimelinePresenceItem({ item }: TimelinePresenceItemProps) {
  if (item.payload.type !== "presence_sent") {
    return null;
  }

  const pulseLabel = getPulseLabel(item.payload.value.pulse_type);
  const hasOptionalMessage = item.payload.value.has_optional_message === true;

  return (
    <View style={styles.container}>
      <AppText color="textSecondary" variant="caption">
        {pulseLabel ? `Pulse: ${pulseLabel}.` : "A gentle pulse was shared."}
      </AppText>
      {hasOptionalMessage ? (
        <AppText color="textSecondary" variant="caption">
          Included a short note.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});

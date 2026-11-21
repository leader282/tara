import { StyleSheet, View } from "react-native";

import { AppText, Icon, type IconName } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { colors, radii, type ColorName } from "@/theme/tokens";

type TimelineTypeIconProps = {
  item: TimelineDisplayItem;
};

const ICON_BY_TYPE: Record<
  TimelineDisplayItem["type"],
  { icon: IconName; color: ColorName; background: string }
> = {
  presence_sent: { icon: "heart", color: "primaryStrong", background: colors.primarySoft },
  ritual_completed: { icon: "sparkles", color: "warning", background: colors.warningSoft },
  capsule_created: { icon: "gift", color: "primaryStrong", background: colors.primarySoft },
  capsule_opened: { icon: "mail-open-outline", color: "success", background: colors.successSoft },
  countdown_updated: { icon: "airplane-outline", color: "info", background: colors.infoSoft },
  parallel_moment_completed: { icon: "people-outline", color: "info", background: colors.infoSoft },
  unknown: { icon: "ellipse-outline", color: "textSecondary", background: colors.surfaceMuted },
};

function getPulseEmoji(item: TimelineDisplayItem): { emoji: string; tint: string } | null {
  if (item.payload.type !== "presence_sent") {
    return null;
  }

  const pulseType = item.payload.value.pulse_type;
  if (!pulseType || !(pulseType in PRESENCE_PULSE_OPTIONS)) {
    return null;
  }

  const option = PRESENCE_PULSE_OPTIONS[pulseType as keyof typeof PRESENCE_PULSE_OPTIONS];
  return { emoji: option.emoji, tint: option.tint };
}

export function TimelineTypeIcon({ item }: TimelineTypeIconProps) {
  const pulse = getPulseEmoji(item);
  const presentation = ICON_BY_TYPE[item.type];

  return (
    <View
      accessibilityLabel={item.typeLabel}
      style={[styles.container, { backgroundColor: pulse?.tint ?? presentation.background }]}
    >
      {pulse ? (
        <AppText maxFontSizeMultiplier={1} style={styles.emoji}>
          {pulse.emoji}
        </AppText>
      ) : (
        <Icon color={presentation.color} name={presentation.icon} size={18} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderColor: colors.background,
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 24,
  },
});

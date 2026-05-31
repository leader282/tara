import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import type { RitualInputType } from "@/features/rituals/types";
import { colors, radii, spacing } from "@/theme/tokens";

type RitualInputTypeNoticeProps = {
  inputType: RitualInputType;
};

function getInputTypeNotice(inputType: RitualInputType): string {
  if (inputType === "photo") {
    return "Photo answers are coming later. For now, this ritual is unavailable in text-first mode.";
  }

  if (inputType === "text_or_photo") {
    return "Text answers are available now. Photo replies arrive in a later phase.";
  }

  return "This ritual currently supports text answers.";
}

export function RitualInputTypeNotice({ inputType }: RitualInputTypeNoticeProps) {
  return (
    <View style={styles.notice}>
      <AppText color="textSecondary" variant="caption">
        {getInputTypeNotice(inputType)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
});

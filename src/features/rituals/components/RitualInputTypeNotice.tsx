import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import type { RitualInputType } from "@/features/rituals/types";
import { colors, radii, spacing } from "@/theme/tokens";

type RitualInputTypeNoticeProps = {
  inputType: RitualInputType;
};

function getInputTypeNotice(inputType: RitualInputType): string {
  if (inputType === "photo") {
    return "Add a private photo to complete this ritual.";
  }

  if (inputType === "text_or_photo") {
    return "You can answer with text, a private photo, or both.";
  }

  return "This ritual accepts text responses.";
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

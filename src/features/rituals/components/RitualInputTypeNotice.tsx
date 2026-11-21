import { InlineMessage } from "@/components/ui";
import type { RitualInputType } from "@/features/rituals/types";

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
  return <InlineMessage icon="images-outline" message={getInputTypeNotice(inputType)} tone="info" />;
}

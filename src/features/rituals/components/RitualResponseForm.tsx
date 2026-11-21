import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod";

import { AppText, Button, Icon, InlineMessage, TextField } from "@/components/ui";
import { MediaAttachmentField } from "@/features/media/components/MediaAttachmentField";
import type { MediaAsset } from "@/features/media/types";
import { RitualInputTypeNotice } from "@/features/rituals/components/RitualInputTypeNotice";
import type { CompleteRitualInput, RitualInputType } from "@/features/rituals/types";
import { spacing } from "@/theme/tokens";

const ritualResponseBaseSchema = z.object({
  textResponse: z
    .string()
    .optional()
    .refine((value) => value === undefined || value.trim().length <= 1000, {
      message: "Keep your response under 1000 characters.",
    }),
  mediaAssetId: z.string().uuid().nullable().optional(),
});

type RitualResponseFormValues = z.input<typeof ritualResponseBaseSchema>;

type RitualResponseFormProps = {
  inputType: RitualInputType;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (
    payload: Pick<CompleteRitualInput, "textResponse" | "mediaAssetId">
  ) => Promise<void> | void;
};

const MAX_RESPONSE_LENGTH = 1000;

function buildRitualResponseFormSchema(inputType: RitualInputType) {
  return ritualResponseBaseSchema.superRefine((value, context) => {
    const normalizedTextResponse = value.textResponse?.trim() ?? "";
    const hasTextResponse = normalizedTextResponse.length > 0;
    const hasMedia = Boolean(value.mediaAssetId);

    if (inputType === "text" && !hasTextResponse) {
      context.addIssue({
        code: "custom",
        message: "Add a short response before completing this ritual.",
        path: ["textResponse"],
      });
      return;
    }

    if (inputType === "photo" && !hasMedia) {
      context.addIssue({
        code: "custom",
        message: "Add a private photo before completing this ritual.",
        path: ["mediaAssetId"],
      });
      return;
    }

    if (inputType === "text_or_photo" && !hasTextResponse && !hasMedia) {
      context.addIssue({
        code: "custom",
        message: "Add a response or private photo before completing this ritual.",
        path: ["textResponse"],
      });
    }
  });
}

export function RitualResponseForm({
  inputType,
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: RitualResponseFormProps) {
  const [attachedMediaAsset, setAttachedMediaAsset] = useState<MediaAsset | null>(null);
  const supportsTextResponse = inputType !== "photo";
  const supportsMediaResponse = inputType !== "text";
  const ritualResponseFormSchema = buildRitualResponseFormSchema(inputType);

  const { control, handleSubmit, formState, setValue } = useForm<RitualResponseFormValues>({
    defaultValues: {
      textResponse: "",
      mediaAssetId: null,
    },
    mode: "onChange",
    resolver: zodResolver(ritualResponseFormSchema),
  });

  const handleSave = handleSubmit(async (values) => {
    const normalizedTextResponse = values.textResponse?.trim() ?? "";
    await onSubmit({
      textResponse: normalizedTextResponse.length > 0 ? normalizedTextResponse : null,
      mediaAssetId: values.mediaAssetId ?? null,
    });
  });

  return (
    <View style={styles.container}>
      {inputType !== "text" ? <RitualInputTypeNotice inputType={inputType} /> : null}

      {supportsTextResponse ? (
        <Controller
          control={control}
          name="textResponse"
          render={({ field, fieldState }) => (
            <TextField
              accessibilityLabel="Ritual response"
              autoCapitalize="sentences"
              autoCorrect
              editable={!isSubmitting}
              errorMessage={fieldState.error?.message}
              keyboardType="default"
              label={inputType === "text_or_photo" ? "Your answer (optional)" : "Your answer"}
              maxLength={MAX_RESPONSE_LENGTH}
              multiline
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={
                inputType === "text_or_photo"
                  ? "Write a short answer, or add a photo below."
                  : "Write a short answer..."
              }
              showCount
              style={styles.input}
              value={field.value ?? ""}
            />
          )}
        />
      ) : null}

      {supportsMediaResponse ? (
        <MediaAttachmentField
          disabled={isSubmitting}
          helperText={
            inputType === "photo"
              ? "A private photo is required for this ritual."
              : "Attach a private photo if you want to reply with media."
          }
          label="Photo"
          onChange={(nextMediaAsset) => {
            setAttachedMediaAsset(nextMediaAsset);
            setValue("mediaAssetId", nextMediaAsset?.id ?? null, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          purpose="ritual_completion"
          required={inputType === "photo"}
          value={attachedMediaAsset}
        />
      ) : null}

      {formState.errors.mediaAssetId?.message ? (
        <InlineMessage message={formState.errors.mediaAssetId.message} tone="danger" />
      ) : null}

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <View style={styles.privacyRow}>
        <Icon color="textTertiary" name="lock-closed-outline" size={14} />
        <AppText color="textTertiary" style={styles.privacyText} variant="caption">
          Your answer stays hidden until you&apos;ve both answered.
        </AppText>
      </View>

      <Button
        disabled={!formState.isValid || isSubmitting}
        icon="checkmark"
        loading={isSubmitting}
        onPress={handleSave}
        title={inputType === "photo" ? "Save my photo" : "Save my answer"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  input: {
    minHeight: 120,
  },
  privacyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  privacyText: {
    flex: 1,
  },
});

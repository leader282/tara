import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod";

import { AppText, Button, Icon, InlineMessage, TextField } from "@/components/ui";
import { MediaGalleryField } from "@/features/media/components/MediaGalleryField";
import type { CompleteRitualInput, RitualInputType } from "@/features/rituals/types";
import { spacing } from "@/theme/tokens";

const ritualResponseBaseSchema = z.object({
  textResponse: z
    .string()
    .optional()
    .refine((value) => value === undefined || value.trim().length <= 1000, {
      message: "Keep your response under 1000 characters.",
    }),
  mediaAssetIds: z.array(z.string().uuid()),
});

type RitualResponseFormValues = z.input<typeof ritualResponseBaseSchema>;

type RitualResponseFormProps = {
  inputType: RitualInputType;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (
    payload: Pick<CompleteRitualInput, "textResponse" | "mediaAssetIds">
  ) => Promise<void> | void;
};

const MAX_RESPONSE_LENGTH = 1000;

function buildRitualResponseFormSchema(inputType: RitualInputType) {
  return ritualResponseBaseSchema.superRefine((value, context) => {
    const normalizedTextResponse = value.textResponse?.trim() ?? "";
    const hasTextResponse = normalizedTextResponse.length > 0;
    const hasMedia = value.mediaAssetIds.length > 0;

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
        message: "Add a photo or a short video before saving.",
        path: ["mediaAssetIds"],
      });
      return;
    }

    if (inputType === "text_or_photo" && !hasTextResponse && !hasMedia) {
      context.addIssue({
        code: "custom",
        message: "Add an answer, a photo, or a short video before saving.",
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
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const supportsTextResponse = inputType !== "photo";
  const supportsMediaResponse = inputType !== "text";
  const ritualResponseFormSchema = buildRitualResponseFormSchema(inputType);

  const { control, handleSubmit, formState, setValue } = useForm<RitualResponseFormValues>({
    defaultValues: {
      textResponse: "",
      mediaAssetIds: [],
    },
    mode: "onChange",
    resolver: zodResolver(ritualResponseFormSchema),
  });

  const handleSave = handleSubmit(async (values) => {
    const normalizedTextResponse = values.textResponse?.trim() ?? "";
    await onSubmit({
      textResponse: normalizedTextResponse.length > 0 ? normalizedTextResponse : null,
      mediaAssetIds: values.mediaAssetIds,
    });
  });

  return (
    <View style={styles.container}>
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
                  ? "Write a short answer, or add a photo or video below."
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
        <MediaGalleryField
          disabled={isSubmitting}
          helperText={
            inputType === "photo"
              ? "Add at least one photo or 5-second video, up to 5."
              : "Up to 5 photos or 5-second videos."
          }
          onChange={(mediaAssetIds) => {
            setValue("mediaAssetIds", mediaAssetIds, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onUploadingChange={setIsUploadingMedia}
          purpose="ritual_completion"
          required={inputType === "photo"}
        />
      ) : null}

      {formState.errors.mediaAssetIds?.message ? (
        <InlineMessage message={formState.errors.mediaAssetIds.message} tone="danger" />
      ) : null}

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <View style={styles.privacyRow}>
        <Icon color="textTertiary" name="lock-closed-outline" size={14} />
        <AppText color="textTertiary" style={styles.privacyText} variant="caption">
          Your answer stays hidden until you&apos;ve both answered.
        </AppText>
      </View>

      <Button
        disabled={!formState.isValid || isSubmitting || isUploadingMedia}
        icon="checkmark"
        loading={isSubmitting}
        onPress={handleSave}
        title={isUploadingMedia ? "Uploading..." : "Save my answer"}
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

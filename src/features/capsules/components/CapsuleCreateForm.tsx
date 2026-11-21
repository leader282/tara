import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod";

import {
  AppText,
  Button,
  Card,
  DateField,
  InlineMessage,
  TextField,
  TimeField,
} from "@/components/ui";
import { MediaAttachmentField } from "@/features/media/components/MediaAttachmentField";
import type { MediaAsset } from "@/features/media/types";
import {
  CAPSULE_MAX_EMOTIONAL_CONTEXT_LENGTH,
  CAPSULE_MAX_NOTE_LENGTH,
  CAPSULE_MAX_TITLE_LENGTH,
  DEFAULT_CAPSULE_UNLOCK_TIME,
} from "@/features/capsules/constants";
import { createCapsuleSchema } from "@/features/capsules/schemas";
import type { CreateCapsuleInput } from "@/features/capsules/types";
import { formatTimeKey, toDateKey } from "@/lib/dates/calendar";
import { spacing } from "@/theme/tokens";

type CapsuleCreateFormValues = z.input<typeof createCapsuleSchema>;

type CapsuleCreateFormProps = {
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: CreateCapsuleInput) => Promise<void> | void;
  submitError?: string | null;
};

function getTomorrowDateKey(now: Date = new Date()): string {
  return toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
}

export function CapsuleCreateForm({
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitError = null,
}: CapsuleCreateFormProps) {
  const [attachedMediaAsset, setAttachedMediaAsset] = useState<MediaAsset | null>(null);

  const { control, formState, handleSubmit, setValue } = useForm<
    CapsuleCreateFormValues,
    undefined,
    CreateCapsuleInput
  >({
    defaultValues: {
      title: "",
      note: "",
      mediaAssetId: null,
      unlockDate: getTomorrowDateKey(),
      unlockTime: DEFAULT_CAPSULE_UNLOCK_TIME,
      emotionalContext: "",
    },
    mode: "onChange",
    resolver: zodResolver(createCapsuleSchema),
  });

  const handleSave = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.section}>
          <AppText color="textSecondary" variant="overline">
            The memory
          </AppText>
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Capsule title"
                autoCapitalize="sentences"
                autoCorrect
                editable={!isSubmitting}
                errorMessage={fieldState.error?.message}
                label="Title"
                maxLength={CAPSULE_MAX_TITLE_LENGTH}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Our first anniversary"
                returnKeyType="next"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="note"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Capsule note"
                autoCapitalize="sentences"
                autoCorrect
                editable={!isSubmitting}
                errorMessage={fieldState.error?.message}
                label="Note"
                maxLength={CAPSULE_MAX_NOTE_LENGTH}
                multiline
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Write something your future selves will love to read."
                showCount
                style={styles.noteInput}
                value={field.value ?? ""}
              />
            )}
          />

          <MediaAttachmentField
            disabled={isSubmitting}
            helperText="Optional. Add a private photo to open together later."
            label="Photo"
            onChange={(nextMediaAsset) => {
              setAttachedMediaAsset(nextMediaAsset);
              setValue("mediaAssetId", nextMediaAsset?.id ?? null, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            purpose="memory_capsule_content"
            value={attachedMediaAsset}
          />

          {formState.errors.mediaAssetId?.message ? (
            <InlineMessage message={formState.errors.mediaAssetId.message} tone="danger" />
          ) : null}
        </View>
      </Card>

      <Card>
        <View style={styles.section}>
          <AppText color="textSecondary" variant="overline">
            When it opens
          </AppText>
          <Controller
            control={control}
            name="unlockDate"
            render={({ field, fieldState }) => (
              <DateField
                accessibilityLabel="Unlock date"
                disabled={isSubmitting}
                errorMessage={fieldState.error?.message}
                label="Unlock date"
                minDate={toDateKey(new Date())}
                onChange={field.onChange}
                sheetTitle="Choose an unlock date"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="unlockTime"
            render={({ field, fieldState }) => (
              <TimeField
                accessibilityLabel="Unlock time"
                clearable
                defaultTime={DEFAULT_CAPSULE_UNLOCK_TIME}
                disabled={isSubmitting}
                errorMessage={fieldState.error?.message}
                helperText={`Leave empty to open at ${formatTimeKey(DEFAULT_CAPSULE_UNLOCK_TIME)}.`}
                label="Unlock time (optional)"
                onChange={field.onChange}
                sheetTitle="Choose an unlock time"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="emotionalContext"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Emotional context"
                autoCapitalize="sentences"
                autoCorrect
                editable={!isSubmitting}
                errorMessage={fieldState.error?.message}
                helperText="Visible to both of you before it opens."
                label="How this moment feels (optional)"
                maxLength={CAPSULE_MAX_EMOTIONAL_CONTEXT_LENGTH}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Excited, nervous, so in love..."
                returnKeyType="done"
                value={field.value ?? ""}
              />
            )}
          />
        </View>
      </Card>

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <View style={styles.actions}>
        <Button
          disabled={!formState.isValid || isSubmitting}
          icon="lock-closed"
          loading={isSubmitting}
          onPress={handleSave}
          title="Save capsule"
        />
        {onCancel ? (
          <Button disabled={isSubmitting} onPress={onCancel} title="Cancel" variant="ghost" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.lg,
  },
  noteInput: {
    minHeight: 150,
  },
  actions: {
    gap: spacing.sm,
  },
});

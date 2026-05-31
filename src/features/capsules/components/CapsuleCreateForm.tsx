import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod";

import { AppText, Button, Card, TextField } from "@/components/ui";
import { DEFAULT_CAPSULE_UNLOCK_TIME, CAPSULE_MAX_NOTE_LENGTH } from "@/features/capsules/constants";
import { createCapsuleSchema } from "@/features/capsules/schemas";
import type { CreateCapsuleInput } from "@/features/capsules/types";
import { spacing } from "@/theme/tokens";

type CapsuleCreateFormValues = z.input<typeof createCapsuleSchema>;

type CapsuleCreateFormProps = {
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: CreateCapsuleInput) => Promise<void> | void;
  submitError?: string | null;
};

function getTomorrowDateInputValue(now: Date = new Date()): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(
    tomorrow.getDate()
  ).padStart(2, "0")}`;
}

export function CapsuleCreateForm({
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitError = null,
}: CapsuleCreateFormProps) {
  const [noteLength, setNoteLength] = useState(0);

  const { control, formState, handleSubmit } = useForm<
    CapsuleCreateFormValues,
    undefined,
    CreateCapsuleInput
  >({
    defaultValues: {
      title: "",
      note: "",
      unlockDate: getTomorrowDateInputValue(),
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
        <View style={styles.form}>
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
                maxLength={120}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="A short title"
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
                onChangeText={(nextValue) => {
                  field.onChange(nextValue);
                  setNoteLength(nextValue.length);
                }}
                placeholder="Write something your future selves will love to read."
                style={styles.noteInput}
                textAlignVertical="top"
                value={field.value ?? ""}
              />
            )}
          />

          <AppText color="textSecondary" variant="caption">
            {noteLength}/{CAPSULE_MAX_NOTE_LENGTH}
          </AppText>

          <Controller
            control={control}
            name="unlockDate"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Unlock date"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                errorMessage={fieldState.error?.message}
                keyboardType="numbers-and-punctuation"
                label="Unlock date"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="YYYY-MM-DD"
                returnKeyType="next"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="unlockTime"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Unlock time"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                errorMessage={fieldState.error?.message}
                keyboardType="numbers-and-punctuation"
                label="Unlock time (optional)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="HH:mm"
                returnKeyType="next"
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
                label="Emotional context (optional)"
                maxLength={240}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="How this moment feels"
                returnKeyType="done"
                value={field.value ?? ""}
              />
            )}
          />

          <AppText color="textSecondary" variant="caption">
            Leave unlock time blank to use {DEFAULT_CAPSULE_UNLOCK_TIME}.
          </AppText>
        </View>
      </Card>

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={!formState.isValid || isSubmitting}
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
    gap: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  noteInput: {
    minHeight: 160,
  },
  actions: {
    gap: spacing.md,
  },
});

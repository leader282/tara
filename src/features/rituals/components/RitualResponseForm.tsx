import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod";

import { AppText, Button, TextField } from "@/components/ui";
import { completeRitualSchema } from "@/features/rituals/schemas";
import type { RitualInputType } from "@/features/rituals/types";
import { spacing } from "@/theme/tokens";

const ritualResponseFormSchema = completeRitualSchema.pick({
  textResponse: true,
});

type RitualResponseFormValues = z.infer<typeof ritualResponseFormSchema>;

type RitualResponseFormProps = {
  inputType: RitualInputType;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (textResponse: string) => Promise<void> | void;
};

const MAX_RESPONSE_LENGTH = 1000;

export function RitualResponseForm({
  inputType,
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: RitualResponseFormProps) {
  const [responseLength, setResponseLength] = useState(0);

  const { control, handleSubmit, formState } = useForm<RitualResponseFormValues>({
    defaultValues: {
      textResponse: "",
    },
    mode: "onChange",
    resolver: zodResolver(ritualResponseFormSchema),
  });

  const handleSave = handleSubmit(async (values) => {
    await onSubmit(values.textResponse);
  });

  return (
    <View style={styles.container}>
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
            label="Your answer"
            maxLength={MAX_RESPONSE_LENGTH}
            multiline
            onBlur={field.onBlur}
            onChangeText={(nextValue) => {
              field.onChange(nextValue);
              setResponseLength(nextValue.length);
            }}
            placeholder="Write a short answer..."
            style={styles.input}
            textAlignVertical="top"
            value={field.value ?? ""}
          />
        )}
      />

      <AppText color="textSecondary" variant="caption">
        {responseLength}/{MAX_RESPONSE_LENGTH}
      </AppText>

      {inputType === "text_or_photo" ? (
        <AppText color="textSecondary" variant="caption">
          You can answer with text now. Photo replies arrive in a later phase.
        </AppText>
      ) : null}

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || isSubmitting}
        loading={isSubmitting}
        onPress={handleSave}
        title="Save my answer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  input: {
    minHeight: 120,
  },
});

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen, TextField } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getActiveCoupleState } from "@/features/couple/api/coupleApi";
import { InviteErrorMessage } from "@/features/invite/components/InviteErrorMessage";
import { createCoupleSchema } from "@/features/invite/schemas";
import { useCreateCoupleWithInvite } from "@/features/invite/hooks/useCreateCoupleWithInvite";
import { toInviteActionMessage } from "@/lib/errors/inviteErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

function isActiveCoupleError(message: string): boolean {
  return message.toLowerCase().includes("already have an active couple");
}

export function CreateCoupleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createCoupleMutation = useCreateCoupleWithInvite();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      anniversaryDate: "",
    },
    mode: "onChange",
    resolver: zodResolver(createCoupleSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await createCoupleMutation.mutateAsync({
        anniversaryDate: values.anniversaryDate,
      });
      router.replace("/(invite)/waiting");
    } catch (error) {
      const message = toInviteActionMessage(error);
      setSubmitError(message);

      if (!user?.id || !isActiveCoupleError(message)) {
        return;
      }

      try {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.couple.activeState(user.id),
        });

        const refreshedState = await queryClient.fetchQuery({
          queryKey: queryKeys.couple.activeState(user.id),
          queryFn: () => getActiveCoupleState(user.id),
        });

        if (refreshedState.status === "paired") {
          router.replace("/(couple)");
          return;
        }

        if (refreshedState.status === "waiting") {
          router.replace("/(invite)/waiting");
        }
      } catch {
        // Keep calm submit error above if background refresh fails.
      }
    }
  });

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Create your couple space</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          You can optionally add your anniversary now, or set it later.
        </AppText>
      </View>

      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="anniversaryDate"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Anniversary date"
                autoCapitalize="none"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                keyboardType="numbers-and-punctuation"
                label="Anniversary date (optional)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="YYYY-MM-DD"
                returnKeyType="done"
                value={field.value ?? ""}
              />
            )}
          />

          <AppText color="textSecondary" variant="caption">
            No one can discover your space publicly. Only your invite code can add a partner.
          </AppText>
        </View>
      </Card>

      <InviteErrorMessage message={submitError} />

      <Button
        loading={createCoupleMutation.isPending}
        onPress={onSubmit}
        title="Create and continue"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
});

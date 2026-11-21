import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { useGoBack } from "@/components/navigation/useGoBack";
import { Button, Card, DateField, InlineMessage, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getActiveCoupleState } from "@/features/couple/api/coupleApi";
import { InviteErrorMessage } from "@/features/invite/components/InviteErrorMessage";
import { createCoupleSchema } from "@/features/invite/schemas";
import { useCreateCoupleWithInvite } from "@/features/invite/hooks/useCreateCoupleWithInvite";
import { toDateKey } from "@/lib/dates/calendar";
import { toInviteActionMessage } from "@/lib/errors/inviteErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

function isActiveCoupleError(message: string): boolean {
  return message.toLowerCase().includes("already have an active couple");
}

export function CreateCoupleScreen() {
  const router = useRouter();
  const goBack = useGoBack("/(invite)");
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
    <Screen
      onBack={goBack}
      scroll
      subtitle="You can optionally add your anniversary now, or set it later."
      title="Create your couple space"
    >
      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="anniversaryDate"
            render={({ field, fieldState }) => (
              <DateField
                accessibilityLabel="Anniversary date"
                clearable
                errorMessage={fieldState.error?.message}
                label="Anniversary date (optional)"
                maxDate={toDateKey(new Date())}
                onChange={field.onChange}
                placeholder="When did your story begin?"
                sheetTitle="Your anniversary"
                value={field.value ?? ""}
              />
            )}
          />
        </View>
      </Card>

      <InlineMessage
        icon="shield-checkmark-outline"
        message="No one can discover your space publicly. Only your invite code can add a partner."
        tone="neutral"
      />

      <InviteErrorMessage message={submitError} />

      <Button
        iconRight="arrow-forward"
        loading={createCoupleMutation.isPending}
        onPress={onSubmit}
        title="Create and continue"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
});

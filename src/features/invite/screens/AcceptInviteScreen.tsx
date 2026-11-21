import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useGoBack } from "@/components/navigation/useGoBack";
import { Button, Card, Screen, TextField } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getActiveCoupleState } from "@/features/couple/api/coupleApi";
import { InviteErrorMessage } from "@/features/invite/components/InviteErrorMessage";
import { acceptInviteSchema, type AcceptInviteInput } from "@/features/invite/schemas";
import { useAcceptCoupleInvite } from "@/features/invite/hooks/useAcceptCoupleInvite";
import { toInviteActionMessage } from "@/lib/errors/inviteErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

type AcceptInviteScreenProps = {
  initialCode?: string;
};

export function AcceptInviteScreen({ initialCode = "" }: AcceptInviteScreenProps) {
  const router = useRouter();
  const goBack = useGoBack("/(invite)");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const acceptInviteMutation = useAcceptCoupleInvite();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, setValue, formState } = useForm<AcceptInviteInput>({
    defaultValues: {
      inviteCode: initialCode,
    },
    mode: "onChange",
    resolver: zodResolver(acceptInviteSchema),
  });

  useEffect(() => {
    if (!initialCode) {
      return;
    }

    setValue("inviteCode", initialCode, { shouldValidate: true });
  }, [initialCode, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await acceptInviteMutation.mutateAsync(values.inviteCode);

      if (!user?.id) {
        router.replace("/(invite)");
        return;
      }

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
        return;
      }

      router.replace("/(invite)");
    } catch (error) {
      setSubmitError(toInviteActionMessage(error));
    }
  });

  return (
    <Screen
      onBack={goBack}
      scroll
      subtitle="Paste the code your partner shared. Only valid invite codes can join a private couple space."
      title="Join with an invite code"
    >
      <Card>
        <Controller
          control={control}
          name="inviteCode"
          render={({ field, fieldState }) => (
            <TextField
              accessibilityLabel="Invite code"
              autoCapitalize="none"
              autoCorrect={false}
              errorMessage={fieldState.error?.message}
              label="Invite code"
              leftIcon="key-outline"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              onSubmitEditing={() => {
                if (formState.isValid) {
                  void onSubmit();
                }
              }}
              placeholder="Paste invite code"
              returnKeyType="go"
              value={field.value ?? ""}
            />
          )}
        />
      </Card>

      <InviteErrorMessage message={submitError} />

      <Button
        disabled={!formState.isValid || acceptInviteMutation.isPending}
        icon="heart"
        loading={acceptInviteMutation.isPending}
        onPress={onSubmit}
        title="Join couple space"
      />
    </Screen>
  );
}

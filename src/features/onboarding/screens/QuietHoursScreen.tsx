import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button, Card, ErrorState, InlineMessage, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { OnboardingHeader } from "@/features/onboarding/components/OnboardingHeader";
import { QuietHoursFields } from "@/features/onboarding/components/QuietHoursFields";
import { quietHoursSchema, type QuietHoursInput } from "@/features/onboarding/schemas";
import { useUserSettings } from "@/features/profile/hooks/useUserSettings";
import { useUpdateUserSettings } from "@/features/profile/hooks/useUpdateUserSettings";

function toHHmm(value: string | null): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function toFriendlySubmitError(): string {
  return "We couldn't save quiet hours yet. Please try again.";
}

export function QuietHoursScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userSettingsQuery = useUserSettings(user?.id);
  const updateUserSettingsMutation = useUpdateUserSettings();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset, setValue } = useForm<QuietHoursInput>({
    defaultValues: {
      quietHoursEnabled: false,
      quietHoursStart: "",
      quietHoursEnd: "",
    },
    mode: "onChange",
    resolver: zodResolver(quietHoursSchema),
  });

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (!userSettingsQuery.isFetched || isDirty) {
      return;
    }

    const settings = userSettingsQuery.data;
    const start = toHHmm(settings?.quiet_hours_start ?? null);
    const end = toHHmm(settings?.quiet_hours_end ?? null);

    reset({
      quietHoursEnabled: Boolean(start && end),
      quietHoursStart: start,
      quietHoursEnd: end,
    });
  }, [isDirty, reset, userSettingsQuery.data, userSettingsQuery.isFetched]);

  const quietHoursStartValue = useWatch({ control, name: "quietHoursStart" }) ?? "";
  const quietHoursEndValue = useWatch({ control, name: "quietHoursEnd" }) ?? "";

  const onSubmit = handleSubmit(async (values) => {
    if (!user?.id) {
      setSubmitError("Please sign in again to continue onboarding.");
      return;
    }

    try {
      setSubmitError(null);
      await updateUserSettingsMutation.mutateAsync({
        userId: user.id,
        quietHoursStart: values.quietHoursEnabled ? values.quietHoursStart : null,
        quietHoursEnd: values.quietHoursEnabled ? values.quietHoursEnd : null,
      });
      router.push("/(onboarding)/complete");
    } catch {
      setSubmitError(toFriendlySubmitError());
    }
  });

  if (!user?.id) {
    return (
      <Screen centered>
        <ErrorState message="Please sign in to continue your onboarding." title="Sign-in required" />
      </Screen>
    );
  }

  if (userSettingsQuery.isLoading && !userSettingsQuery.data) {
    return (
      <Screen centered>
        <LoadingState label="Loading quiet hours..." />
      </Screen>
    );
  }

  return (
    <Screen onBack={() => router.back()} scroll>
      <OnboardingHeader
        step={3}
        stepTitle="Quiet hours"
        subtitle="Tara should respect your rest. We'll keep your connection gentle."
        title="Choose your quiet hours"
      />

      <Card>
        <Controller
          control={control}
          name="quietHoursEnabled"
          render={({ field }) => (
            <QuietHoursFields
              onChangeEnabled={(nextValue) => {
                field.onChange(nextValue);
                if (!nextValue) {
                  setValue("quietHoursStart", "", { shouldValidate: true });
                  setValue("quietHoursEnd", "", { shouldValidate: true });
                }
              }}
              onChangeQuietHoursEnd={(value) =>
                setValue("quietHoursEnd", value, { shouldValidate: true })
              }
              onChangeQuietHoursStart={(value) =>
                setValue("quietHoursStart", value, { shouldValidate: true })
              }
              quietHoursEnabled={Boolean(field.value)}
              quietHoursEnd={quietHoursEndValue}
              quietHoursEndError={formState.errors.quietHoursEnd?.message}
              quietHoursStart={quietHoursStartValue}
              quietHoursStartError={formState.errors.quietHoursStart?.message}
            />
          )}
        />
      </Card>

      <InlineMessage
        icon="moon-outline"
        message="During quiet hours, gentle updates wait until you're awake."
        tone="neutral"
      />

      {userSettingsQuery.error ? (
        <InlineMessage
          message="We couldn't load previous quiet hours, but you can set them now."
          tone="warning"
        />
      ) : null}

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <Button
        disabled={!isValid || updateUserSettingsMutation.isPending}
        iconRight="arrow-forward"
        loading={updateUserSettingsMutation.isPending}
        onPress={onSubmit}
        title="Continue"
      />
    </Screen>
  );
}

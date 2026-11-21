import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
import { Button, Card, ErrorState, InlineMessage, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { QuietHoursFields } from "@/features/onboarding/components/QuietHoursFields";
import { useSettingsProfile } from "@/features/settings/hooks/useSettingsProfile";
import { useUpdateQuietHours } from "@/features/settings/hooks/useUpdateQuietHours";
import {
  quietHoursSettingsFormSchema,
  type QuietHoursSettingsFormInput,
} from "@/features/settings/schemas";
import { formatTimeKey } from "@/lib/dates/calendar";

function toHHmm(value: string | null): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export function QuietHoursSettingsScreen() {
  const goBack = useGoBack("/(settings)");
  const toast = useToast();
  const { user } = useAuth();
  const settingsProfileQuery = useSettingsProfile(user?.id);
  const updateQuietHoursMutation = useUpdateQuietHours();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset, setValue } = useForm<QuietHoursSettingsFormInput>({
    defaultValues: {
      quietHoursEnabled: false,
      quietHoursStart: "",
      quietHoursEnd: "",
    },
    mode: "onChange",
    resolver: zodResolver(quietHoursSettingsFormSchema),
  });

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (!settingsProfileQuery.isFetched || isDirty) {
      return;
    }

    const userSettings = settingsProfileQuery.data?.userSettings;
    const notificationPreferences = settingsProfileQuery.data?.notificationPreferences;
    const start = toHHmm(userSettings?.quiet_hours_start ?? null);
    const end = toHHmm(userSettings?.quiet_hours_end ?? null);

    reset({
      quietHoursEnabled: notificationPreferences?.quiet_hours_enabled ?? Boolean(start && end),
      quietHoursStart: start,
      quietHoursEnd: end,
    });
  }, [
    isDirty,
    reset,
    settingsProfileQuery.data?.notificationPreferences,
    settingsProfileQuery.data?.userSettings,
    settingsProfileQuery.isFetched,
  ]);

  const quietHoursStart = useWatch({ control, name: "quietHoursStart" }) ?? "";
  const quietHoursEnd = useWatch({ control, name: "quietHoursEnd" }) ?? "";
  const quietHoursEnabled = useWatch({ control, name: "quietHoursEnabled" }) ?? false;

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await updateQuietHoursMutation.mutateAsync({
        quietHoursEnabled: values.quietHoursEnabled,
        quietHoursStart: values.quietHoursEnabled ? values.quietHoursStart : null,
        quietHoursEnd: values.quietHoursEnabled ? values.quietHoursEnd : null,
      });
      reset(values);
      toast.show({
        tone: "success",
        emoji: "🌙",
        title: "Quiet hours saved",
        message:
          values.quietHoursEnabled && values.quietHoursStart && values.quietHoursEnd
            ? `Tara will stay quiet from ${formatTimeKey(values.quietHoursStart)} to ${formatTimeKey(values.quietHoursEnd)}.`
            : "Quiet hours are off for now.",
      });
    } catch {
      setSubmitError(
        updateQuietHoursMutation.friendlyError ?? "We couldn't save quiet hours settings right now.",
      );
    }
  });

  if (!user?.id) {
    return (
      <Screen centered onBack={goBack}>
        <ErrorState message="Please sign in to edit quiet hours." title="Sign-in required" />
      </Screen>
    );
  }

  if (settingsProfileQuery.isLoading && !settingsProfileQuery.data) {
    return (
      <Screen centered onBack={goBack}>
        <LoadingState label="Loading quiet hours..." />
      </Screen>
    );
  }

  if (settingsProfileQuery.error && !settingsProfileQuery.data) {
    return (
      <Screen centered onBack={goBack}>
        <ErrorState
          message="We couldn't load quiet hours settings right now."
          onRetry={() => {
            void settingsProfileQuery.refetch();
          }}
          title="Quiet hours unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen onBack={goBack} scroll subtitle="Tara should respect your rest." title="Quiet hours">
      <Card>
        <Controller
          control={control}
          name="quietHoursEnabled"
          render={({ field }) => (
            <QuietHoursFields
              onChangeEnabled={(nextValue) => {
                field.onChange(nextValue);
                if (!nextValue) {
                  setValue("quietHoursStart", "", { shouldDirty: true, shouldValidate: true });
                  setValue("quietHoursEnd", "", { shouldDirty: true, shouldValidate: true });
                }
              }}
              onChangeQuietHoursEnd={(value) =>
                setValue("quietHoursEnd", value, { shouldDirty: true, shouldValidate: true })
              }
              onChangeQuietHoursStart={(value) =>
                setValue("quietHoursStart", value, { shouldDirty: true, shouldValidate: true })
              }
              quietHoursEnabled={quietHoursEnabled}
              quietHoursEnd={quietHoursEnd}
              quietHoursEndError={formState.errors.quietHoursEnd?.message}
              quietHoursStart={quietHoursStart}
              quietHoursStartError={formState.errors.quietHoursStart?.message}
            />
          )}
        />
      </Card>

      <InlineMessage
        icon="moon-outline"
        message="When notifications are enabled, quiet hours delay non-urgent push scheduling."
        tone="neutral"
      />

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <Button
        disabled={!isDirty || !isValid || updateQuietHoursMutation.isPending}
        icon="checkmark"
        loading={updateQuietHoursMutation.isPending}
        onPress={onSubmit}
        title="Save quiet hours"
      />
    </Screen>
  );
}

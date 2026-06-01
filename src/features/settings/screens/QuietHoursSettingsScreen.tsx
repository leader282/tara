import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { QuietHoursFields } from "@/features/onboarding/components/QuietHoursFields";
import { useSettingsProfile } from "@/features/settings/hooks/useSettingsProfile";
import { useUpdateQuietHours } from "@/features/settings/hooks/useUpdateQuietHours";
import {
  quietHoursSettingsFormSchema,
  type QuietHoursSettingsFormInput,
} from "@/features/settings/schemas";
import { spacing } from "@/theme/tokens";

function toHHmm(value: string | null): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export function QuietHoursSettingsScreen() {
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

  useEffect(() => {
    if (!settingsProfileQuery.isFetched || formState.isDirty) {
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
    formState.isDirty,
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
    } catch {
      setSubmitError(
        updateQuietHoursMutation.friendlyError ??
          "We couldn't save quiet hours settings right now.",
      );
    }
  });

  if (!user?.id) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="Please sign in to edit quiet hours."
          title="Sign-in required"
        />
      </Screen>
    );
  }

  if (settingsProfileQuery.isLoading && !settingsProfileQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading quiet hours..." />
      </Screen>
    );
  }

  if (settingsProfileQuery.error && !settingsProfileQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
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
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Quiet hours</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Tara should respect your rest.
        </AppText>
        <AppText color="textSecondary" variant="caption">
          When notifications are enabled, quiet hours delay non-urgent push scheduling.
        </AppText>
      </View>

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
              quietHoursEnabled={quietHoursEnabled}
              quietHoursEnd={quietHoursEnd}
              quietHoursEndError={formState.errors.quietHoursEnd?.message}
              quietHoursStart={quietHoursStart}
              quietHoursStartError={formState.errors.quietHoursStart?.message}
            />
          )}
        />
      </Card>

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      {updateQuietHoursMutation.isSuccess ? (
        <AppText color="success" variant="caption">
          Quiet hours saved.
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || updateQuietHoursMutation.isPending}
        loading={updateQuietHoursMutation.isPending}
        onPress={onSubmit}
        title="Save quiet hours"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  loading: {
    justifyContent: "center",
  },
  header: {
    gap: spacing.sm,
  },
});

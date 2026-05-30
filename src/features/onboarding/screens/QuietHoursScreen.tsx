import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";
import { QuietHoursFields } from "@/features/onboarding/components/QuietHoursFields";
import { quietHoursSchema, type QuietHoursInput } from "@/features/onboarding/schemas";
import { useUserSettings } from "@/features/profile/hooks/useUserSettings";
import { useUpdateUserSettings } from "@/features/profile/hooks/useUpdateUserSettings";
import { spacing } from "@/theme/tokens";

const TOTAL_STEPS = 4;

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

  useEffect(() => {
    if (!userSettingsQuery.isFetched || formState.isDirty) {
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
  }, [formState.isDirty, reset, userSettingsQuery.data, userSettingsQuery.isFetched]);

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
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="Please sign in to continue your onboarding."
          title="Sign-in required"
        />
      </Screen>
    );
  }

  if (userSettingsQuery.isLoading && !userSettingsQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading quiet hours..." />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <OnboardingProgress currentStep={3} title="Quiet hours" totalSteps={TOTAL_STEPS} />

      <View style={styles.header}>
        <AppText variant="title">Choose your quiet hours</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Tara should respect your rest. We&apos;ll keep your connection gentle.
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
              quietHoursEnabled={Boolean(field.value)}
              quietHoursEnd={quietHoursEndValue}
              quietHoursEndError={formState.errors.quietHoursEnd?.message}
              quietHoursStart={quietHoursStartValue}
              quietHoursStartError={formState.errors.quietHoursStart?.message}
            />
          )}
        />
      </Card>

      {userSettingsQuery.error ? (
        <AppText color="textSecondary" variant="caption">
          We couldn&apos;t load previous quiet hours, but you can set them now.
        </AppText>
      ) : null}

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || updateUserSettingsMutation.isPending}
        loading={updateUserSettingsMutation.isPending}
        onPress={onSubmit}
        title="Continue"
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

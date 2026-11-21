import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
import {
  Button,
  Card,
  DateField,
  EmptyState,
  ErrorState,
  InlineMessage,
  LoadingState,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { SETTINGS_COUPLE_THEME_OPTIONS, SETTINGS_RITUAL_FREQUENCIES } from "@/features/settings/constants";
import { useCoupleSettings } from "@/features/settings/hooks/useCoupleSettings";
import { useUpdateCoupleSettings } from "@/features/settings/hooks/useUpdateCoupleSettings";
import {
  coupleSettingsFormSchema,
  type CoupleSettingsFormInput,
} from "@/features/settings/schemas";
import { toDateKey } from "@/lib/dates/calendar";
import { spacing } from "@/theme/tokens";

const ritualFrequencyCopy: Record<
  (typeof SETTINGS_RITUAL_FREQUENCIES)[number],
  { label: string; description: string; emoji: string }
> = {
  daily: {
    label: "Daily",
    description: "A ritual each day when it feels right.",
    emoji: "☀️",
  },
  few_times_week: {
    label: "Few times a week",
    description: "A gentle rhythm through the week.",
    emoji: "🌤️",
  },
  weekly: {
    label: "Weekly",
    description: "One shared ritual each week.",
    emoji: "📅",
  },
};

export function CoupleSettingsScreen() {
  const goBack = useGoBack("/(settings)");
  const toast = useToast();
  const activeCoupleState = useActiveCoupleState();
  const pairedCoupleId =
    activeCoupleState.state.status === "paired" ? activeCoupleState.state.couple.id : null;
  const coupleSettingsQuery = useCoupleSettings(pairedCoupleId);
  const updateCoupleSettingsMutation = useUpdateCoupleSettings();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset } = useForm<CoupleSettingsFormInput>({
    defaultValues: {
      anniversaryDate: "",
      ritualFrequency: "daily",
      theme: "",
    },
    mode: "onChange",
    resolver: zodResolver(coupleSettingsFormSchema),
  });

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (!coupleSettingsQuery.isFetched || isDirty) {
      return;
    }

    const settings = coupleSettingsQuery.data;
    reset({
      anniversaryDate: settings?.anniversaryDate ?? "",
      ritualFrequency: settings?.ritualFrequency ?? "daily",
      theme: settings?.theme ?? "",
    });
  }, [coupleSettingsQuery.data, coupleSettingsQuery.isFetched, isDirty, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await updateCoupleSettingsMutation.mutateAsync({
        anniversaryDate: values.anniversaryDate ?? null,
        ritualFrequency: values.ritualFrequency,
        theme: values.theme ?? null,
      });
      reset(values);
      toast.show({
        tone: "success",
        emoji: "💞",
        title: "Couple settings saved",
        message: "These shared settings apply to both of you.",
      });
    } catch {
      setSubmitError(
        updateCoupleSettingsMutation.friendlyError ?? "We couldn't save couple settings right now.",
      );
    }
  });

  const shouldShowThemeOptionCards = SETTINGS_COUPLE_THEME_OPTIONS.length > 0;
  const pairedStatus = activeCoupleState.state.status;

  if (activeCoupleState.isLoading || pairedStatus === "loading") {
    return (
      <Screen centered onBack={goBack}>
        <LoadingState label="Loading couple settings..." />
      </Screen>
    );
  }

  if (activeCoupleState.error) {
    return (
      <Screen centered onBack={goBack}>
        <ErrorState
          message="We couldn't load your couple status right now."
          onRetry={goBack}
          retryLabel="Back to settings"
          title="Couple settings unavailable"
        />
      </Screen>
    );
  }

  if (pairedStatus !== "paired" || !pairedCoupleId) {
    return (
      <Screen centered onBack={goBack}>
        <EmptyState
          actionLabel="Back to settings"
          description="Couple settings unlock after your private space is fully paired."
          icon="heart-outline"
          onActionPress={goBack}
          title="Available after pairing"
        />
      </Screen>
    );
  }

  if (coupleSettingsQuery.isLoading && !coupleSettingsQuery.data) {
    return (
      <Screen centered onBack={goBack}>
        <LoadingState label="Loading shared couple settings..." />
      </Screen>
    );
  }

  if (coupleSettingsQuery.error && !coupleSettingsQuery.data) {
    return (
      <Screen centered onBack={goBack}>
        <ErrorState
          message="We couldn't load current couple settings right now."
          onRetry={() => {
            void coupleSettingsQuery.refetch();
          }}
          title="Couple settings unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen
      onBack={goBack}
      scroll
      subtitle="Manage shared settings without changing couple status or membership."
      title="Couple settings"
    >
      <Card>
        <View style={styles.section}>
          <SectionHeader title="Anniversary" />
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

      <Card>
        <View style={styles.section}>
          <SectionHeader title="Ritual frequency" />
          <Controller
            control={control}
            name="ritualFrequency"
            render={({ field }) => (
              <View style={styles.options}>
                {SETTINGS_RITUAL_FREQUENCIES.map((option) => {
                  const copy = ritualFrequencyCopy[option];
                  return (
                    <OnboardingOptionCard
                      description={copy.description}
                      emoji={copy.emoji}
                      key={option}
                      label={copy.label}
                      onPress={() => field.onChange(option)}
                      selected={field.value === option}
                    />
                  );
                })}
              </View>
            )}
          />
        </View>
      </Card>

      {shouldShowThemeOptionCards ? (
        <Card>
          <View style={styles.section}>
            <SectionHeader title="Theme" />
            <Controller
              control={control}
              name="theme"
              render={({ field }) => (
                <View style={styles.options}>
                  {SETTINGS_COUPLE_THEME_OPTIONS.map((option) => (
                    <OnboardingOptionCard
                      key={option}
                      label={option}
                      onPress={() => field.onChange(option)}
                      selected={field.value === option}
                    />
                  ))}
                </View>
              )}
            />
          </View>
        </Card>
      ) : null}

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      {coupleSettingsQuery.error && coupleSettingsQuery.data ? (
        <InlineMessage
          message="Showing last known values while refreshing shared settings."
          tone="warning"
        />
      ) : null}

      <Button
        disabled={
          !isDirty || !isValid || updateCoupleSettingsMutation.isPending
        }
        icon="checkmark"
        loading={updateCoupleSettingsMutation.isPending}
        onPress={onSubmit}
        title="Save couple settings"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
});

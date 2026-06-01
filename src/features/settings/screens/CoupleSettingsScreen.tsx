import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, TextField } from "@/components/ui";
import { useRouter } from "expo-router";

import { useActiveCoupleState } from "@/features/couple/hooks/useActiveCoupleState";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { SETTINGS_COUPLE_THEME_OPTIONS, SETTINGS_RITUAL_FREQUENCIES } from "@/features/settings/constants";
import { useCoupleSettings } from "@/features/settings/hooks/useCoupleSettings";
import { useUpdateCoupleSettings } from "@/features/settings/hooks/useUpdateCoupleSettings";
import {
  coupleSettingsFormSchema,
  type CoupleSettingsFormInput,
} from "@/features/settings/schemas";
import { spacing } from "@/theme/tokens";

const ritualFrequencyCopy: Record<(typeof SETTINGS_RITUAL_FREQUENCIES)[number], { label: string; description: string }> = {
  daily: {
    label: "Daily",
    description: "A ritual each day when it feels right.",
  },
  few_times_week: {
    label: "Few times a week",
    description: "A gentle rhythm through the week.",
  },
  weekly: {
    label: "Weekly",
    description: "One shared ritual each week.",
  },
};

export function CoupleSettingsScreen() {
  const router = useRouter();
  const activeCoupleState = useActiveCoupleState();
  const pairedCoupleId =
    activeCoupleState.state.status === "paired" ? activeCoupleState.state.couple.id : null;
  const coupleSettingsQuery = useCoupleSettings(pairedCoupleId);
  const updateCoupleSettingsMutation = useUpdateCoupleSettings();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState,
    reset,
  } = useForm<CoupleSettingsFormInput>({
    defaultValues: {
      anniversaryDate: "",
      ritualFrequency: "daily",
      theme: "",
    },
    mode: "onChange",
    resolver: zodResolver(coupleSettingsFormSchema),
  });

  useEffect(() => {
    if (!coupleSettingsQuery.isFetched || formState.isDirty) {
      return;
    }

    const settings = coupleSettingsQuery.data;
    reset({
      anniversaryDate: settings?.anniversaryDate ?? "",
      ritualFrequency: settings?.ritualFrequency ?? "daily",
      theme: settings?.theme ?? "",
    });
  }, [coupleSettingsQuery.data, coupleSettingsQuery.isFetched, formState.isDirty, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await updateCoupleSettingsMutation.mutateAsync({
        anniversaryDate: values.anniversaryDate ?? null,
        ritualFrequency: values.ritualFrequency,
        theme: values.theme ?? null,
      });
    } catch {
      setSubmitError(
        updateCoupleSettingsMutation.friendlyError ??
          "We couldn't save couple settings right now.",
      );
    }
  });

  const shouldShowThemeOptionCards = SETTINGS_COUPLE_THEME_OPTIONS.length > 0;
  const pairedStatus = activeCoupleState.state.status;

  if (activeCoupleState.isLoading || pairedStatus === "loading") {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading couple settings..." />
      </Screen>
    );
  }

  if (activeCoupleState.error) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="We couldn't load your couple status right now."
          onRetry={() => {
            void router.replace("/(settings)");
          }}
          title="Couple settings unavailable"
        />
      </Screen>
    );
  }

  if (pairedStatus !== "paired" || !pairedCoupleId) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <EmptyState
          actionLabel="Back to settings"
          description="Couple settings unlock after your private space is fully paired."
          onActionPress={() => router.replace("/(settings)")}
          title="Available after pairing"
        />
      </Screen>
    );
  }

  if (coupleSettingsQuery.isLoading && !coupleSettingsQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading shared couple settings..." />
      </Screen>
    );
  }

  if (coupleSettingsQuery.error && !coupleSettingsQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
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
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Couple settings</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Manage shared settings without changing couple status or membership.
        </AppText>
      </View>

      <Card>
        <View style={styles.section}>
          <AppText variant="subtitle">Anniversary date</AppText>
          <Controller
            control={control}
            name="anniversaryDate"
            render={({ field, fieldState }) => (
              <View style={styles.inputGroup}>
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
              </View>
            )}
          />
        </View>
      </Card>

      <Card>
        <View style={styles.section}>
          <AppText variant="subtitle">Ritual frequency</AppText>
          <Controller
            control={control}
            name="ritualFrequency"
            render={({ field }) => (
              <View style={styles.options}>
                {SETTINGS_RITUAL_FREQUENCIES.map((option) => {
                  const copy = ritualFrequencyCopy[option];
                  return (
                    <OnboardingOptionCard
                      key={option}
                      description={copy.description}
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
            <AppText variant="subtitle">Theme</AppText>
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

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      {coupleSettingsQuery.error && coupleSettingsQuery.data ? (
        <AppText color="textSecondary" variant="caption">
          Showing last known values while refreshing shared settings.
        </AppText>
      ) : null}

      {updateCoupleSettingsMutation.isSuccess ? (
        <AppText color="success" variant="caption">
          Couple settings saved.
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || updateCoupleSettingsMutation.isPending}
        loading={updateCoupleSettingsMutation.isPending}
        onPress={onSubmit}
        title="Save couple settings"
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
  section: {
    gap: spacing.md,
  },
  options: {
    gap: spacing.sm,
  },
  inputGroup: {
    gap: spacing.sm,
  },
});

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { LoveSignalSelector } from "@/features/onboarding/components/LoveSignalSelector";
import {
  SETTINGS_EMOTIONAL_TONES,
  SETTINGS_LOVE_SIGNALS,
  SETTINGS_NOTIFICATION_TONES,
} from "@/features/settings/constants";
import { useSettingsProfile } from "@/features/settings/hooks/useSettingsProfile";
import { useUpdateSettingsProfile } from "@/features/settings/hooks/useUpdateSettingsProfile";
import {
  emotionalSettingsFormSchema,
  type EmotionalSettingsFormInput,
} from "@/features/settings/schemas";
import { spacing } from "@/theme/tokens";

const emotionalToneCopy: Record<
  (typeof SETTINGS_EMOTIONAL_TONES)[number],
  { label: string; description: string }
> = {
  soft: {
    label: "Soft",
    description: "Gentle and calm check-ins.",
  },
  playful: {
    label: "Playful",
    description: "Light moments that keep connection warm.",
  },
  grounding: {
    label: "Grounding",
    description: "Steady support when life feels full.",
  },
  romantic: {
    label: "Romantic",
    description: "Affection-forward moments when you want them.",
  },
  minimal: {
    label: "Minimal",
    description: "Simple and low-noise communication.",
  },
};

const notificationToneCopy: Record<
  (typeof SETTINGS_NOTIFICATION_TONES)[number],
  { label: string; description: string }
> = {
  gentle: {
    label: "Gentle",
    description: "Warm and calm reminders.",
  },
  minimal: {
    label: "Minimal",
    description: "Quiet reminders with little interruption.",
  },
  playful: {
    label: "Playful",
    description: "A little extra spark when it feels right.",
  },
};

function isEmotionalTone(
  value: string | null | undefined,
): value is (typeof SETTINGS_EMOTIONAL_TONES)[number] {
  return Boolean(value && SETTINGS_EMOTIONAL_TONES.includes(value as (typeof SETTINGS_EMOTIONAL_TONES)[number]));
}

function isNotificationTone(
  value: string | null | undefined,
): value is (typeof SETTINGS_NOTIFICATION_TONES)[number] {
  return Boolean(
    value && SETTINGS_NOTIFICATION_TONES.includes(value as (typeof SETTINGS_NOTIFICATION_TONES)[number]),
  );
}

function isLoveSignal(value: string): value is (typeof SETTINGS_LOVE_SIGNALS)[number] {
  return SETTINGS_LOVE_SIGNALS.includes(value as (typeof SETTINGS_LOVE_SIGNALS)[number]);
}

export function EmotionalSettingsScreen() {
  const { user } = useAuth();
  const settingsProfileQuery = useSettingsProfile(user?.id);
  const updateSettingsProfileMutation = useUpdateSettingsProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset } = useForm<EmotionalSettingsFormInput>({
    defaultValues: {
      emotionalTone: "soft",
      preferredLoveSignals: ["thinking_of_you"],
      notificationTone: "gentle",
    },
    mode: "onChange",
    resolver: zodResolver(emotionalSettingsFormSchema),
  });

  useEffect(() => {
    if (!settingsProfileQuery.isFetched || formState.isDirty) {
      return;
    }

    const userSettings = settingsProfileQuery.data?.userSettings;
    const availableLoveSignals = userSettings?.preferred_love_signals ?? [];
    const selectedLoveSignals = availableLoveSignals.filter(isLoveSignal);

    reset({
      emotionalTone: isEmotionalTone(userSettings?.emotional_tone)
        ? userSettings.emotional_tone
        : "soft",
      preferredLoveSignals:
        selectedLoveSignals.length > 0
          ? (selectedLoveSignals as EmotionalSettingsFormInput["preferredLoveSignals"])
          : ["thinking_of_you"],
      notificationTone: isNotificationTone(userSettings?.notification_tone)
        ? userSettings.notification_tone
        : "gentle",
    });
  }, [formState.isDirty, reset, settingsProfileQuery.data?.userSettings, settingsProfileQuery.isFetched]);

  const onSubmit = handleSubmit(async (values) => {
    const profile = settingsProfileQuery.data?.profile;
    if (!profile) {
      setSubmitError("Profile details are required before updating emotional preferences.");
      return;
    }

    try {
      setSubmitError(null);
      await updateSettingsProfileMutation.mutateAsync({
        displayName: profile.display_name,
        timezone: profile.timezone ?? "UTC",
        city: profile.city,
        country: profile.country,
        birthday: profile.birthday,
        emotionalTone: values.emotionalTone,
        preferredLoveSignals: values.preferredLoveSignals,
        notificationTone: values.notificationTone,
      });
    } catch {
      setSubmitError(
        updateSettingsProfileMutation.friendlyError ??
          "We couldn't save emotional preferences right now.",
      );
    }
  });

  if (!user?.id) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="Please sign in to edit emotional preferences."
          title="Sign-in required"
        />
      </Screen>
    );
  }

  if (settingsProfileQuery.isLoading && !settingsProfileQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading emotional preferences..." />
      </Screen>
    );
  }

  if (settingsProfileQuery.error && !settingsProfileQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="We couldn't load emotional preferences right now."
          onRetry={() => {
            void settingsProfileQuery.refetch();
          }}
          title="Preferences unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Emotional preferences</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Adjust this whenever you want. It should feel supportive, never like a personality test.
        </AppText>
      </View>

      <Card>
        <View style={styles.section}>
          <AppText variant="subtitle">Emotional tone</AppText>
          <Controller
            control={control}
            name="emotionalTone"
            render={({ field }) => (
              <View style={styles.options}>
                {SETTINGS_EMOTIONAL_TONES.map((tone) => {
                  const option = emotionalToneCopy[tone];
                  return (
                    <OnboardingOptionCard
                      key={tone}
                      description={option.description}
                      label={option.label}
                      onPress={() => field.onChange(tone)}
                      selected={field.value === tone}
                    />
                  );
                })}
              </View>
            )}
          />
        </View>
      </Card>

      <Card>
        <View style={styles.section}>
          <AppText variant="subtitle">Preferred love signals</AppText>
          <Controller
            control={control}
            name="preferredLoveSignals"
            render={({ field, fieldState }) => (
              <LoveSignalSelector
                errorMessage={fieldState.error?.message}
                onChange={field.onChange}
                selectedValues={field.value}
              />
            )}
          />
        </View>
      </Card>

      <Card>
        <View style={styles.section}>
          <AppText variant="subtitle">Notification tone</AppText>
          <Controller
            control={control}
            name="notificationTone"
            render={({ field }) => (
              <View style={styles.options}>
                {SETTINGS_NOTIFICATION_TONES.map((tone) => {
                  const option = notificationToneCopy[tone];
                  return (
                    <OnboardingOptionCard
                      key={tone}
                      description={option.description}
                      label={option.label}
                      onPress={() => field.onChange(tone)}
                      selected={field.value === tone}
                    />
                  );
                })}
              </View>
            )}
          />
        </View>
      </Card>

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      {updateSettingsProfileMutation.isSuccess ? (
        <AppText color="success" variant="caption">
          Emotional preferences saved.
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || updateSettingsProfileMutation.isPending}
        loading={updateSettingsProfileMutation.isPending}
        onPress={onSubmit}
        title="Save emotional preferences"
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
});

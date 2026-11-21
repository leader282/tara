import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
import {
  Button,
  Card,
  ErrorState,
  InlineMessage,
  LoadingState,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoveSignalSelector } from "@/features/onboarding/components/LoveSignalSelector";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { EMOTIONAL_TONE_COPY, NOTIFICATION_TONE_COPY } from "@/features/onboarding/constants";
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
  const goBack = useGoBack("/(settings)");
  const toast = useToast();
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

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (!settingsProfileQuery.isFetched || isDirty) {
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
  }, [isDirty, reset, settingsProfileQuery.data?.userSettings, settingsProfileQuery.isFetched]);

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
      reset(values);
      toast.show({
        tone: "success",
        emoji: EMOTIONAL_TONE_COPY[values.emotionalTone].emoji,
        title: "Emotional preferences saved",
        message: "Tara will follow your lead.",
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
      <Screen centered onBack={goBack}>
        <ErrorState message="Please sign in to edit emotional preferences." title="Sign-in required" />
      </Screen>
    );
  }

  if (settingsProfileQuery.isLoading && !settingsProfileQuery.data) {
    return (
      <Screen centered onBack={goBack}>
        <LoadingState label="Loading emotional preferences..." />
      </Screen>
    );
  }

  if (settingsProfileQuery.error && !settingsProfileQuery.data) {
    return (
      <Screen centered onBack={goBack}>
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
    <Screen
      onBack={goBack}
      scroll
      subtitle="Adjust this whenever you want. It should feel supportive, never like a personality test."
      title="Emotional preferences"
    >
      <Card>
        <View style={styles.section}>
          <SectionHeader title="Emotional tone" />
          <Controller
            control={control}
            name="emotionalTone"
            render={({ field }) => (
              <View style={styles.options}>
                {SETTINGS_EMOTIONAL_TONES.map((tone) => {
                  const option = EMOTIONAL_TONE_COPY[tone];
                  return (
                    <OnboardingOptionCard
                      description={option.description}
                      emoji={option.emoji}
                      key={tone}
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
          <SectionHeader description="Choose as many as you like." title="Preferred love signals" />
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
          <SectionHeader title="Notification tone" />
          <Controller
            control={control}
            name="notificationTone"
            render={({ field }) => (
              <View style={styles.options}>
                {SETTINGS_NOTIFICATION_TONES.map((tone) => {
                  const option = NOTIFICATION_TONE_COPY[tone];
                  return (
                    <OnboardingOptionCard
                      description={option.description}
                      emoji={option.emoji}
                      key={tone}
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

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <Button
        disabled={
          !isDirty || !isValid || updateSettingsProfileMutation.isPending
        }
        icon="checkmark"
        loading={updateSettingsProfileMutation.isPending}
        onPress={onSubmit}
        title="Save emotional preferences"
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

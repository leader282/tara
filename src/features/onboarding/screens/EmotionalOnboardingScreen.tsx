import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

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
import { OnboardingHeader } from "@/features/onboarding/components/OnboardingHeader";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { EMOTIONAL_TONE_COPY, NOTIFICATION_TONE_COPY } from "@/features/onboarding/constants";
import {
  emotionalPreferencesSchema,
  type EmotionalPreferencesInput,
} from "@/features/onboarding/schemas";
import {
  EMOTIONAL_TONES,
  LOVE_SIGNALS,
  NOTIFICATION_TONES,
  type EmotionalTone,
  type LoveSignal,
  type NotificationTone,
} from "@/features/onboarding/types";
import { useUserSettings } from "@/features/profile/hooks/useUserSettings";
import { useUpdateUserSettings } from "@/features/profile/hooks/useUpdateUserSettings";
import { spacing } from "@/theme/tokens";

const emotionSet = new Set<string>(EMOTIONAL_TONES);
const loveSignalSet = new Set<string>(LOVE_SIGNALS);
const notificationToneSet = new Set<string>(NOTIFICATION_TONES);

function isEmotionalTone(value: string | null | undefined): value is EmotionalTone {
  return typeof value === "string" && emotionSet.has(value);
}

function isLoveSignal(value: string): value is LoveSignal {
  return loveSignalSet.has(value);
}

function isNotificationTone(value: string | null | undefined): value is NotificationTone {
  return typeof value === "string" && notificationToneSet.has(value);
}

function toFriendlySubmitError(): string {
  return "We couldn't save your preferences just yet. Please try again.";
}

export function EmotionalOnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userSettingsQuery = useUserSettings(user?.id);
  const updateUserSettingsMutation = useUpdateUserSettings();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset } = useForm<EmotionalPreferencesInput>({
    defaultValues: {
      emotionalTone: "soft",
      preferredLoveSignals: ["thinking_of_you"],
      notificationTone: "gentle",
    },
    mode: "onChange",
    resolver: zodResolver(emotionalPreferencesSchema),
  });

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (!userSettingsQuery.isFetched || isDirty) {
      return;
    }

    const settings = userSettingsQuery.data;
    const preferredSignals = (settings?.preferred_love_signals ?? []).filter(isLoveSignal);

    reset({
      emotionalTone: isEmotionalTone(settings?.emotional_tone) ? settings.emotional_tone : "soft",
      preferredLoveSignals: preferredSignals.length > 0 ? preferredSignals : ["thinking_of_you"],
      notificationTone: isNotificationTone(settings?.notification_tone)
        ? settings.notification_tone
        : "gentle",
    });
  }, [isDirty, reset, userSettingsQuery.data, userSettingsQuery.isFetched]);

  const onSubmit = handleSubmit(async (values) => {
    if (!user?.id) {
      setSubmitError("Please sign in again to continue onboarding.");
      return;
    }

    try {
      setSubmitError(null);
      await updateUserSettingsMutation.mutateAsync({
        userId: user.id,
        emotionalTone: values.emotionalTone,
        preferredLoveSignals: values.preferredLoveSignals,
        notificationTone: values.notificationTone ?? null,
      });
      router.push("/(onboarding)/quiet-hours");
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
        <LoadingState label="Loading your preferences..." />
      </Screen>
    );
  }

  return (
    <Screen onBack={() => router.back()} scroll>
      <OnboardingHeader
        step={2}
        stepTitle="Emotional preferences"
        subtitle="Pick the emotional tone and signals that feel supportive, never pressure-filled."
        title="How should Tara feel between you two?"
      />

      <Card>
        <View style={styles.section}>
          <SectionHeader title="Emotional tone" />
          <Controller
            control={control}
            name="emotionalTone"
            render={({ field }) => (
              <View style={styles.options}>
                {EMOTIONAL_TONES.map((tone) => {
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
                selectedValues={field.value ?? []}
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
                {NOTIFICATION_TONES.map((tone) => {
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

      {userSettingsQuery.error ? (
        <InlineMessage
          message="We couldn't load saved preferences, but you can continue with fresh choices."
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

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
});

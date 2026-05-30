import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoveSignalSelector } from "@/features/onboarding/components/LoveSignalSelector";
import { OnboardingOptionCard } from "@/features/onboarding/components/OnboardingOptionCard";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";
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

const TOTAL_STEPS = 4;

const emotionalToneCopy: Record<EmotionalTone, { label: string; description: string }> = {
  soft: {
    label: "Soft",
    description: "Gentle and calm check-ins.",
  },
  playful: {
    label: "Playful",
    description: "Light, cute moments that keep things fun.",
  },
  grounding: {
    label: "Grounding",
    description: "Steady connection when life feels busy.",
  },
  romantic: {
    label: "Romantic",
    description: "More affection in your everyday rhythm.",
  },
  minimal: {
    label: "Minimal",
    description: "Simple, low-noise ways to stay close.",
  },
};

const notificationToneCopy: Record<
  NotificationTone,
  { label: string; description: string }
> = {
  gentle: {
    label: "Gentle",
    description: "Warm and calm reminders.",
  },
  minimal: {
    label: "Minimal",
    description: "Quiet and low-key nudges.",
  },
  playful: {
    label: "Playful",
    description: "A little extra spark in tone.",
  },
};

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

  useEffect(() => {
    if (!userSettingsQuery.isFetched || formState.isDirty) {
      return;
    }

    const settings = userSettingsQuery.data;
    const preferredSignals = (settings?.preferred_love_signals ?? []).filter(isLoveSignal);

    reset({
      emotionalTone: isEmotionalTone(settings?.emotional_tone)
        ? settings.emotional_tone
        : "soft",
      preferredLoveSignals:
        preferredSignals.length > 0 ? preferredSignals : ["thinking_of_you"],
      notificationTone: isNotificationTone(settings?.notification_tone)
        ? settings.notification_tone
        : "gentle",
    });
  }, [formState.isDirty, reset, userSettingsQuery.data, userSettingsQuery.isFetched]);

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
        <LoadingState label="Loading your preferences..." />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <OnboardingProgress currentStep={2} title="Emotional preferences" totalSteps={TOTAL_STEPS} />

      <View style={styles.header}>
        <AppText variant="title">How should Tara feel between you two?</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Pick the emotional tone and signals that feel supportive, never pressure-filled.
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
                {EMOTIONAL_TONES.map((tone) => {
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
                selectedValues={field.value ?? []}
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
                {NOTIFICATION_TONES.map((tone) => {
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

      {userSettingsQuery.error ? (
        <AppText color="textSecondary" variant="caption">
          We couldn&apos;t load saved preferences, but you can continue with fresh choices.
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
  section: {
    gap: spacing.md,
  },
  options: {
    gap: spacing.sm,
  },
});

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState, LoadingState, Screen, TextField } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";
import {
  profileSetupSchema,
  type ProfileSetupInput,
} from "@/features/onboarding/schemas";
import { useCurrentProfile } from "@/features/profile/hooks/useCurrentProfile";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { getDeviceTimeZone } from "@/lib/dates/timezone";
import { spacing } from "@/theme/tokens";

const TOTAL_STEPS = 4;

function toFriendlySubmitError(): string {
  return "We couldn't save your profile yet. Please try again in a moment.";
}

export function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const profileQuery = useCurrentProfile(user?.id);
  const updateProfileMutation = useUpdateProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fallbackTimeZone = useMemo(() => getDeviceTimeZone(), []);

  const { control, handleSubmit, formState, reset } = useForm<ProfileSetupInput>({
    defaultValues: {
      displayName: "",
      timezone: fallbackTimeZone,
      city: "",
      country: "",
      birthday: "",
    },
    mode: "onChange",
    resolver: zodResolver(profileSetupSchema),
  });

  useEffect(() => {
    if (!profileQuery.isFetched || formState.isDirty) {
      return;
    }

    const profile = profileQuery.data;
    reset({
      displayName: profile?.display_name ?? "",
      timezone: profile?.timezone ?? fallbackTimeZone,
      city: profile?.city ?? "",
      country: profile?.country ?? "",
      birthday: profile?.birthday ?? "",
    });
  }, [fallbackTimeZone, formState.isDirty, profileQuery.data, profileQuery.isFetched, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!user?.id) {
      setSubmitError("Please sign in again to continue onboarding.");
      return;
    }

    try {
      setSubmitError(null);
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        displayName: values.displayName,
        timezone: values.timezone,
        city: values.city,
        country: values.country,
        birthday: values.birthday,
      });
      router.push("/(onboarding)/emotional");
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

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading your profile..." />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <OnboardingProgress currentStep={1} title="Profile" totalSteps={TOTAL_STEPS} />

      <View style={styles.header}>
        <AppText variant="title">Let&apos;s set up your side of Tara</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Keep this simple for now. You can update details anytime.
        </AppText>
      </View>

      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="displayName"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Display name"
                autoCapitalize="words"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                label="Display name"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="How your partner sees your name"
                returnKeyType="next"
                textContentType="name"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="timezone"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Timezone"
                autoCapitalize="none"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                label="Timezone"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Asia/Kolkata"
                returnKeyType="next"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="City"
                autoCapitalize="words"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                label="City (optional)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Mumbai"
                returnKeyType="next"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="country"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Country"
                autoCapitalize="words"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                label="Country (optional)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="India"
                returnKeyType="next"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="birthday"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Birthday"
                autoCapitalize="none"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                keyboardType="numbers-and-punctuation"
                label="Birthday (optional)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="YYYY-MM-DD"
                returnKeyType="done"
                value={field.value ?? ""}
              />
            )}
          />
        </View>
      </Card>

      {profileQuery.error ? (
        <AppText color="textSecondary" variant="caption">
          We couldn&apos;t load existing profile details, but you can still continue.
        </AppText>
      ) : null}

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || updateProfileMutation.isPending}
        loading={updateProfileMutation.isPending}
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
  form: {
    gap: spacing.md,
  },
});

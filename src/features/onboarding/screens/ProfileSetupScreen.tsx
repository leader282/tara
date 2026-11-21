import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, type TextInput, View } from "react-native";

import {
  Button,
  Card,
  DateField,
  ErrorState,
  InlineMessage,
  LoadingState,
  Screen,
  TextField,
} from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { OnboardingHeader } from "@/features/onboarding/components/OnboardingHeader";
import {
  profileSetupSchema,
  type ProfileSetupInput,
} from "@/features/onboarding/schemas";
import { TimezoneField } from "@/features/profile/components/TimezoneField";
import { useCurrentProfile } from "@/features/profile/hooks/useCurrentProfile";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { toDateKey } from "@/lib/dates/calendar";
import { getDeviceTimeZone } from "@/lib/dates/timezone";
import { spacing } from "@/theme/tokens";

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
  const countryRef = useRef<TextInput>(null);

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

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (!profileQuery.isFetched || isDirty) {
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
  }, [fallbackTimeZone, isDirty, profileQuery.data, profileQuery.isFetched, reset]);

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
      <Screen centered>
        <ErrorState message="Please sign in to continue your onboarding." title="Sign-in required" />
      </Screen>
    );
  }

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <Screen centered>
        <LoadingState label="Loading your profile..." />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <OnboardingHeader
        step={1}
        stepTitle="Profile"
        subtitle="Keep this simple for now. You can update details anytime."
        title="Let's set up your side of Tara"
      />

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
                leftIcon="person-outline"
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
              <TimezoneField
                errorMessage={fieldState.error?.message}
                onBlur={field.onBlur}
                onChange={field.onChange}
                value={field.value ?? ""}
              />
            )}
          />

          <View style={styles.row}>
            <Controller
              control={control}
              name="city"
              render={({ field, fieldState }) => (
                <TextField
                  accessibilityLabel="City"
                  autoCapitalize="words"
                  autoCorrect={false}
                  containerStyle={styles.rowField}
                  errorMessage={fieldState.error?.message}
                  label="City (optional)"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  onSubmitEditing={() => countryRef.current?.focus()}
                  placeholder="Mumbai"
                  returnKeyType="next"
                  submitBehavior="submit"
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
                  containerStyle={styles.rowField}
                  errorMessage={fieldState.error?.message}
                  label="Country (optional)"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="India"
                  ref={countryRef}
                  returnKeyType="done"
                  value={field.value ?? ""}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="birthday"
            render={({ field, fieldState }) => (
              <DateField
                accessibilityLabel="Birthday"
                clearable
                errorMessage={fieldState.error?.message}
                helperText="Only your partner can see this."
                label="Birthday (optional)"
                maxDate={toDateKey(new Date())}
                onChange={field.onChange}
                placeholder="Add your birthday"
                sheetTitle="Your birthday"
                value={field.value ?? ""}
              />
            )}
          />
        </View>
      </Card>

      {profileQuery.error ? (
        <InlineMessage
          message="We couldn't load existing profile details, but you can still continue."
          tone="warning"
        />
      ) : null}

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <Button
        disabled={!isValid || updateProfileMutation.isPending}
        iconRight="arrow-forward"
        loading={updateProfileMutation.isPending}
        onPress={onSubmit}
        title="Continue"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
});

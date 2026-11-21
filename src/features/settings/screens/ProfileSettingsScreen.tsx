import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, type TextInput, View } from "react-native";

import { useToast } from "@/components/feedback/ToastProvider";
import { useGoBack } from "@/components/navigation/useGoBack";
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
import { TimezoneField } from "@/features/profile/components/TimezoneField";
import { useSettingsProfile } from "@/features/settings/hooks/useSettingsProfile";
import { useUpdateSettingsProfile } from "@/features/settings/hooks/useUpdateSettingsProfile";
import {
  settingsProfileFormSchema,
  type SettingsProfileFormInput,
} from "@/features/settings/schemas";
import { toDateKey } from "@/lib/dates/calendar";
import { getDeviceTimeZone } from "@/lib/dates/timezone";
import { spacing } from "@/theme/tokens";

export function ProfileSettingsScreen() {
  const goBack = useGoBack("/(settings)");
  const toast = useToast();
  const { user } = useAuth();
  const settingsProfileQuery = useSettingsProfile(user?.id);
  const updateSettingsProfileMutation = useUpdateSettingsProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const countryRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState, reset } = useForm<SettingsProfileFormInput>({
    defaultValues: {
      displayName: "",
      timezone: getDeviceTimeZone(),
      city: "",
      country: "",
      birthday: "",
    },
    mode: "onChange",
    resolver: zodResolver(settingsProfileFormSchema),
  });

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

  useEffect(() => {
    if (!settingsProfileQuery.isFetched || isDirty) {
      return;
    }

    const profile = settingsProfileQuery.data?.profile;
    reset({
      displayName: profile?.display_name ?? "",
      timezone: profile?.timezone ?? getDeviceTimeZone(),
      city: profile?.city ?? "",
      country: profile?.country ?? "",
      birthday: profile?.birthday ?? "",
    });
  }, [isDirty, reset, settingsProfileQuery.data?.profile, settingsProfileQuery.isFetched]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await updateSettingsProfileMutation.mutateAsync({
        displayName: values.displayName,
        timezone: values.timezone,
        city: values.city ?? null,
        country: values.country ?? null,
        birthday: values.birthday ?? null,
      });
      reset(values);
      toast.show({
        tone: "success",
        title: "Profile saved",
        message: "Your partner will see the update right away.",
      });
    } catch {
      setSubmitError(updateSettingsProfileMutation.friendlyError ?? "We couldn't save profile settings.");
    }
  });

  if (!user?.id) {
    return (
      <Screen centered onBack={goBack}>
        <ErrorState message="Please sign in to edit profile settings." title="Sign-in required" />
      </Screen>
    );
  }

  if (settingsProfileQuery.isLoading && !settingsProfileQuery.data) {
    return (
      <Screen centered onBack={goBack}>
        <LoadingState label="Loading profile settings..." />
      </Screen>
    );
  }

  if (settingsProfileQuery.error && !settingsProfileQuery.data) {
    return (
      <Screen centered onBack={goBack}>
        <ErrorState
          message="We couldn't load profile settings right now."
          onRetry={() => {
            void settingsProfileQuery.refetch();
          }}
          title="Profile settings unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen
      onBack={goBack}
      scroll
      subtitle="Update how your side of Tara appears in your couple space."
      title="Profile settings"
    >
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
                  placeholder="City"
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
                  placeholder="Country"
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

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

      <Button
        disabled={
          !isDirty || !isValid || updateSettingsProfileMutation.isPending
        }
        icon="checkmark"
        loading={updateSettingsProfileMutation.isPending}
        onPress={onSubmit}
        title="Save profile settings"
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

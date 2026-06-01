import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState, LoadingState, Screen, TextField } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSettingsProfile } from "@/features/settings/hooks/useSettingsProfile";
import { useUpdateSettingsProfile } from "@/features/settings/hooks/useUpdateSettingsProfile";
import {
  settingsProfileFormSchema,
  type SettingsProfileFormInput,
} from "@/features/settings/schemas";
import { getDeviceTimeZone } from "@/lib/dates/timezone";
import { spacing } from "@/theme/tokens";

export function ProfileSettingsScreen() {
  const { user } = useAuth();
  const settingsProfileQuery = useSettingsProfile(user?.id);
  const updateSettingsProfileMutation = useUpdateSettingsProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState,
    reset,
  } = useForm<SettingsProfileFormInput>({
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

  useEffect(() => {
    if (!settingsProfileQuery.isFetched || formState.isDirty) {
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
  }, [formState.isDirty, reset, settingsProfileQuery.data?.profile, settingsProfileQuery.isFetched]);

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
    } catch {
      setSubmitError(updateSettingsProfileMutation.friendlyError ?? "We couldn't save profile settings.");
    }
  });

  if (!user?.id) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="Please sign in to edit profile settings."
          title="Sign-in required"
        />
      </Screen>
    );
  }

  if (settingsProfileQuery.isLoading && !settingsProfileQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading profile settings..." />
      </Screen>
    );
  }

  if (settingsProfileQuery.error && !settingsProfileQuery.data) {
    return (
      <Screen contentContainerStyle={styles.loading}>
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
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Profile settings</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Update how your side of Tara appears in your couple space.
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
                placeholder="City"
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
                placeholder="Country"
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

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      {updateSettingsProfileMutation.isSuccess ? (
        <AppText color="success" variant="caption">
          Profile settings saved.
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || updateSettingsProfileMutation.isPending}
        loading={updateSettingsProfileMutation.isPending}
        onPress={onSubmit}
        title="Save profile settings"
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

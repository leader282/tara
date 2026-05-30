import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState, LoadingState, Screen, TextField } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { useUpdateNextMeetup } from "@/features/couple/hooks/useUpdateNextMeetup";
import { editMeetupSchema } from "@/features/couple/schemas";
import { parseMeetupDateTimeFromFields } from "@/lib/dates/format";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

type MeetupFormValues = {
  meetupDate: string;
  meetupTime: string;
  meetupLocation: string;
  clearMeetup: boolean;
};

function formatDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toMeetupFormValues(
  nextMeetupAt: string | null,
  nextMeetupLocation: string | null
): MeetupFormValues {
  if (!nextMeetupAt) {
    return {
      meetupDate: "",
      meetupTime: "",
      meetupLocation: nextMeetupLocation ?? "",
      clearMeetup: false,
    };
  }

  const parsedDate = new Date(nextMeetupAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return {
      meetupDate: "",
      meetupTime: "",
      meetupLocation: nextMeetupLocation ?? "",
      clearMeetup: false,
    };
  }

  return {
    meetupDate: formatDateInputValue(parsedDate),
    meetupTime: formatTimeInputValue(parsedDate),
    meetupLocation: nextMeetupLocation ?? "",
    clearMeetup: false,
  };
}

function normalizeOptionalLocation(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function EditMeetupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();
  const updateNextMeetupMutation = useUpdateNextMeetup();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState,
    reset,
  } = useForm({
    defaultValues: {
      meetupDate: "",
      meetupTime: "",
      meetupLocation: "",
      clearMeetup: false,
    },
    mode: "onChange",
    resolver: zodResolver(editMeetupSchema),
  });

  const pairedData = coupleHome.state.status === "paired" ? coupleHome.state.data : null;
  const initialValues = useMemo(
    () => toMeetupFormValues(pairedData?.nextMeetupAt ?? null, pairedData?.nextMeetupLocation ?? null),
    [pairedData?.nextMeetupAt, pairedData?.nextMeetupLocation]
  );
  const hasExistingMeetup = Boolean(
    pairedData?.nextMeetupAt || pairedData?.nextMeetupLocation?.trim()
  );
  const formErrorMessage = submitError ?? updateNextMeetupMutation.friendlyError;

  useEffect(() => {
    if (!pairedData || formState.isDirty) {
      return;
    }

    reset(initialValues);
  }, [formState.isDirty, initialValues, pairedData, reset]);

  const invalidateCoupleHome = async () => {
    if (!user?.id) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: queryKeys.couple.home(user.id),
    });
  };

  const handleRetry = () => {
    void invalidateCoupleHome();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!pairedData) {
      setSubmitError("Your couple space is still loading. Please try again.");
      return;
    }

    const nextMeetupAt = parseMeetupDateTimeFromFields(values.meetupDate, values.meetupTime);
    if ((values.meetupDate ?? "").trim().length > 0 && !nextMeetupAt) {
      setSubmitError("Please enter a valid meetup date and time.");
      return;
    }

    try {
      setSubmitError(null);
      await updateNextMeetupMutation.mutateAsync({
        coupleId: pairedData.couple.id,
        nextMeetupAt,
        nextMeetupLocation: normalizeOptionalLocation(values.meetupLocation),
      });
      await invalidateCoupleHome();
      router.replace("/(couple)");
    } catch {
      // Friendly backend messages are exposed by the mutation hook.
    }
  });

  const clearMeetup = async () => {
    if (!pairedData) {
      return;
    }

    try {
      setSubmitError(null);
      await updateNextMeetupMutation.mutateAsync({
        coupleId: pairedData.couple.id,
        nextMeetupAt: null,
        nextMeetupLocation: null,
      });
      await invalidateCoupleHome();
      router.replace("/(couple)");
    } catch {
      // Friendly backend messages are exposed by the mutation hook.
    }
  };

  const handleClearMeetup = () => {
    Alert.alert(
      "Clear next meetup?",
      "This removes the saved reunion date and location. You can add a new meetup anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear meetup",
          style: "destructive",
          onPress: () => {
            void clearMeetup();
          },
        },
      ]
    );
  };

  if (coupleHome.isLoading || coupleHome.state.status === "loading") {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <LoadingState label="Loading meetup details..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message={coupleHome.friendlyError ?? "We couldn't load your reunion details right now."}
          onRetry={handleRetry}
          title="Couldn’t open meetup editor"
        />
      </Screen>
    );
  }

  if (coupleHome.state.status === "none") {
    return <Redirect href="/(invite)" />;
  }

  if (coupleHome.state.status === "waiting") {
    return <Redirect href="/(invite)/waiting" />;
  }

  if (coupleHome.state.status === "invariant_error") {
    return (
      <Screen contentContainerStyle={styles.loading}>
        <ErrorState
          message="Your couple setup needs attention before editing meetup details."
          onRetry={handleRetry}
          title="Meetup editor unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <View style={styles.header}>
        <AppText variant="title">Edit next meetup</AppText>
        <AppText color="textSecondary" variant="bodyMuted">
          Save a reunion date with optional time. Keep location details broad, like a city or place
          name.
        </AppText>
      </View>

      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="meetupDate"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Meetup date"
                autoCapitalize="none"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                keyboardType="numbers-and-punctuation"
                label="Meetup date"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="YYYY-MM-DD"
                returnKeyType="next"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="meetupTime"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Meetup time"
                autoCapitalize="none"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                keyboardType="numbers-and-punctuation"
                label="Meetup time (optional)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="HH:mm"
                returnKeyType="next"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="meetupLocation"
            render={({ field, fieldState }) => (
              <TextField
                accessibilityLabel="Meetup location"
                autoCapitalize="words"
                autoCorrect={false}
                errorMessage={fieldState.error?.message}
                label="Meetup location (optional)"
                maxLength={160}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="City or place"
                returnKeyType="done"
                value={field.value ?? ""}
              />
            )}
          />

          <AppText color="textSecondary" variant="caption">
            Use only a city or place name. Do not enter an exact address.
          </AppText>
        </View>
      </Card>

      {formErrorMessage ? (
        <AppText color="danger" variant="caption">
          {formErrorMessage}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={!formState.isValid || updateNextMeetupMutation.isPending}
          loading={updateNextMeetupMutation.isPending}
          onPress={onSubmit}
          title="Save meetup"
        />
        {hasExistingMeetup ? (
          <Button
            disabled={updateNextMeetupMutation.isPending}
            onPress={handleClearMeetup}
            title="Clear meetup"
            variant="secondary"
          />
        ) : null}
        <Button
          disabled={updateNextMeetupMutation.isPending}
          onPress={() => router.replace("/(couple)")}
          title="Cancel"
          variant="ghost"
        />
      </View>
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
  actions: {
    gap: spacing.md,
  },
});

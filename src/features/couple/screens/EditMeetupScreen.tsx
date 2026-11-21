import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";

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
  TimeField,
} from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoupleHome } from "@/features/couple/hooks/useCoupleHome";
import { useUpdateNextMeetup } from "@/features/couple/hooks/useUpdateNextMeetup";
import { editMeetupSchema } from "@/features/couple/schemas";
import { toDateKey } from "@/lib/dates/calendar";
import { getCountdownParts } from "@/lib/dates/countdown";
import { parseMeetupDateTimeFromFields } from "@/lib/dates/format";
import { queryKeys } from "@/lib/query/queryKeys";
import { spacing } from "@/theme/tokens";

type MeetupFormValues = {
  meetupDate: string;
  meetupTime: string;
  meetupLocation: string;
  clearMeetup: boolean;
};

function formatTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toMeetupFormValues(
  nextMeetupAt: string | null,
  nextMeetupLocation: string | null
): MeetupFormValues {
  const emptyValues = {
    meetupDate: "",
    meetupTime: "",
    meetupLocation: nextMeetupLocation ?? "",
    clearMeetup: false,
  };

  if (!nextMeetupAt) {
    return emptyValues;
  }

  const parsedDate = new Date(nextMeetupAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return emptyValues;
  }

  return {
    ...emptyValues,
    meetupDate: toDateKey(parsedDate),
    meetupTime: formatTimeInputValue(parsedDate),
  };
}

function normalizeOptionalLocation(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function describeCountdown(nextMeetupAt: string): string {
  const countdown = getCountdownParts(new Date(nextMeetupAt));

  switch (countdown.status) {
    case "today":
      return "You reunite today.";
    case "tomorrow":
      return "You'll be together tomorrow.";
    case "upcoming":
      return `${countdown.daysRemaining} days until you're together.`;
    default:
      return "Your countdown is set.";
  }
}

export function EditMeetupScreen() {
  const goBack = useGoBack("/(couple)");
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const coupleHome = useCoupleHome();
  const updateNextMeetupMutation = useUpdateNextMeetup();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      meetupDate: "",
      meetupTime: "",
      meetupLocation: "",
      clearMeetup: false,
    },
    mode: "onChange",
    resolver: zodResolver(editMeetupSchema),
  });

  // formState only tracks what renders read, and the early returns below skip the form,
  // so read these up front or a first loading render leaves isValid stuck at false.
  const { isDirty, isValid } = formState;

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
    if (!pairedData || isDirty) {
      return;
    }

    reset(initialValues);
  }, [isDirty, initialValues, pairedData, reset]);

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
      toast.show({
        tone: "success",
        emoji: "✈️",
        title: "Reunion saved",
        message: nextMeetupAt
          ? `${describeCountdown(nextMeetupAt)} ${pairedData.partnerProfile.display_name} will see it too.`
          : `${pairedData.partnerProfile.display_name} will see it too.`,
      });
      goBack();
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
      toast.show({
        tone: "info",
        icon: "calendar-clear-outline",
        title: "Reunion cleared",
        message: "Set a new date whenever you're ready.",
      });
      goBack();
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
      <Screen centered onBack={goBack}>
        <LoadingState label="Loading meetup details..." />
      </Screen>
    );
  }

  if (coupleHome.error) {
    return (
      <Screen centered onBack={goBack}>
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
      <Screen centered onBack={goBack}>
        <ErrorState
          message="Your couple setup needs attention before editing meetup details."
          onRetry={handleRetry}
          title="Meetup editor unavailable"
        />
      </Screen>
    );
  }

  return (
    <Screen
      onBack={goBack}
      scroll
      subtitle="Save the day you'll be together again. You'll both see the countdown."
      title="Plan your reunion"
    >
      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="meetupDate"
            render={({ field, fieldState }) => (
              <DateField
                accessibilityLabel="Meetup date"
                errorMessage={fieldState.error?.message}
                label="Meetup date"
                minDate={toDateKey(new Date())}
                onChange={field.onChange}
                sheetTitle="When will you be together?"
                value={field.value ?? ""}
              />
            )}
          />

          <Controller
            control={control}
            name="meetupTime"
            render={({ field, fieldState }) => (
              <TimeField
                accessibilityLabel="Meetup time"
                clearable
                defaultTime="12:00"
                errorMessage={fieldState.error?.message}
                label="Meetup time (optional)"
                onChange={field.onChange}
                sheetTitle="What time?"
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
                helperText="Use only a city or place name. Do not enter an exact address."
                label="Meetup location (optional)"
                leftIcon="location-outline"
                maxLength={160}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="City or place"
                returnKeyType="done"
                value={field.value ?? ""}
              />
            )}
          />
        </View>
      </Card>

      {formErrorMessage ? <InlineMessage message={formErrorMessage} tone="danger" /> : null}

      <View style={styles.actions}>
        <Button
          disabled={!isValid || updateNextMeetupMutation.isPending}
          icon="checkmark"
          loading={updateNextMeetupMutation.isPending}
          onPress={onSubmit}
          title="Save meetup"
        />
        {hasExistingMeetup ? (
          <Button
            disabled={updateNextMeetupMutation.isPending}
            icon="trash-outline"
            onPress={handleClearMeetup}
            title="Clear meetup"
            variant="dangerSoft"
          />
        ) : null}
        <Button
          disabled={updateNextMeetupMutation.isPending}
          onPress={goBack}
          title="Cancel"
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
});

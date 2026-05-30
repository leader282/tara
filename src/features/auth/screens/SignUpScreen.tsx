import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { AuthFooterLink } from "@/features/auth/components/AuthFooterLink";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { ControlledTextField } from "@/features/auth/components/ControlledTextField";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { toAuthActionMessage } from "@/lib/errors/authErrorMessages";
import { colors, radii, spacing } from "@/theme/tokens";

const checkEmailMessage =
  "Check your email to confirm your account. After confirmation, sign in to continue.";

export function SignUpScreen() {
  const { signUp } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<SignUpInput>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      setNotice(null);

      const result = await signUp(values);

      if (result.requiresEmailConfirmation) {
        setNotice(checkEmailMessage);
        reset({
          email: values.email,
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      setSubmitError(toAuthActionMessage(error));
    }
  });

  return (
    <AuthScreenLayout
      footer={
        <AuthFooterLink
          href="/(auth)/sign-in"
          linkLabel="Sign in"
          prompt="Already have an account?"
        />
      }
      subtitle="Create your account for Tara."
      title="Create your account"
    >
      <View style={styles.fields}>
        <ControlledTextField
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          control={control}
          keyboardType="email-address"
          label="Email"
          name="email"
          placeholder="you@example.com"
          returnKeyType="next"
          textContentType="emailAddress"
        />
        <ControlledTextField
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          control={control}
          label="Password"
          name="password"
          placeholder="At least 8 characters"
          returnKeyType="next"
          secureTextEntry
          textContentType="newPassword"
        />
        <ControlledTextField
          accessibilityLabel="Confirm password"
          autoCapitalize="none"
          autoCorrect={false}
          control={control}
          label="Confirm password"
          name="confirmPassword"
          placeholder="Re-enter your password"
          returnKeyType="done"
          secureTextEntry
          textContentType="password"
        />
      </View>

      {notice ? (
        <View style={styles.notice}>
          <AppText color="success" variant="caption">
            {notice}
          </AppText>
        </View>
      ) : null}

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || formState.isSubmitting}
        loading={formState.isSubmitting}
        onPress={onSubmit}
        title="Create account"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing.lg,
  },
  notice: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.success,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
});

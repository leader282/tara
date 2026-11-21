import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, type TextInput, View } from "react-native";

import { Button, InlineMessage } from "@/components/ui";
import { AuthFooterLink } from "@/features/auth/components/AuthFooterLink";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { ControlledTextField } from "@/features/auth/components/ControlledTextField";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { toAuthActionMessage } from "@/lib/errors/authErrorMessages";
import { spacing } from "@/theme/tokens";

const checkEmailMessage =
  "Check your email to confirm your account. After confirmation, sign in to continue.";

export function SignUpScreen() {
  const { signUp } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

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
      subtitle="Create your account for Tara. It only takes a minute."
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
          leftIcon="mail-outline"
          name="email"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="you@example.com"
          returnKeyType="next"
          submitBehavior="submit"
          textContentType="emailAddress"
        />
        <ControlledTextField
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          control={control}
          helperText="At least 8 characters."
          label="Password"
          leftIcon="lock-closed-outline"
          name="password"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          placeholder="Create a password"
          ref={passwordRef}
          returnKeyType="next"
          secureTextEntry
          submitBehavior="submit"
          textContentType="newPassword"
        />
        <ControlledTextField
          accessibilityLabel="Confirm password"
          autoCapitalize="none"
          autoCorrect={false}
          control={control}
          label="Confirm password"
          leftIcon="shield-checkmark-outline"
          name="confirmPassword"
          onSubmitEditing={() => {
            if (formState.isValid) {
              void onSubmit();
            }
          }}
          placeholder="Re-enter your password"
          ref={confirmPasswordRef}
          returnKeyType="go"
          secureTextEntry
          textContentType="password"
        />
      </View>

      {notice ? <InlineMessage message={notice} title="Almost there" tone="success" /> : null}

      {submitError ? <InlineMessage message={submitError} tone="danger" /> : null}

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
});

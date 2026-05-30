import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { AuthFooterLink } from "@/features/auth/components/AuthFooterLink";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { ControlledTextField } from "@/features/auth/components/ControlledTextField";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { signInSchema, type SignInInput } from "@/features/auth/schemas";
import { toAuthActionMessage } from "@/lib/errors/authErrorMessages";
import { spacing } from "@/theme/tokens";

export function SignInScreen() {
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<SignInInput>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      await signIn(values);
    } catch (error) {
      setSubmitError(toAuthActionMessage(error));
    }
  });

  return (
    <AuthScreenLayout
      footer={
        <AuthFooterLink
          href="/(auth)/sign-up"
          linkLabel="Create one"
          prompt="Don't have an account?"
        />
      }
      subtitle="Sign in to your private space for two."
      title="Welcome back"
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
          autoCorrect={false}
          autoComplete="password"
          control={control}
          label="Password"
          name="password"
          placeholder="Enter your password"
          returnKeyType="done"
          secureTextEntry
          textContentType="password"
        />
      </View>

      {submitError ? (
        <AppText color="danger" variant="caption">
          {submitError}
        </AppText>
      ) : null}

      <Button
        disabled={!formState.isValid || formState.isSubmitting}
        loading={formState.isSubmitting}
        onPress={onSubmit}
        title="Sign in"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing.lg,
  },
});

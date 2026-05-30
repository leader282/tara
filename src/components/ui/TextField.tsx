import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, radii, spacing } from "@/theme/tokens";

export type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export function TextField({ label, errorMessage, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <AppText color="textSecondary" variant="caption">
        {label}
      </AppText>
      <TextInput
        {...props}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, errorMessage ? styles.inputError : null, style]}
      />
      {errorMessage ? (
        <AppText color="danger" variant="caption">
          {errorMessage}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.textPrimary,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
});

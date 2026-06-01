import { StyleSheet, View } from "react-native";

import { AppText, TextField } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type ConfirmationFieldProps = {
  label: string;
  confirmationValue: string;
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
};

export function ConfirmationField({
  label,
  confirmationValue,
  value,
  onChangeText,
  disabled = false,
}: ConfirmationFieldProps) {
  const trimmedValue = value.trim();
  const isMatched = trimmedValue === confirmationValue;
  const helperText = isMatched
    ? "Confirmation matches."
    : `Type ${confirmationValue} to enable this action.`;

  return (
    <View style={styles.container}>
      <TextField
        accessibilityLabel={label}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!disabled}
        keyboardType="default"
        label={label}
        onChangeText={onChangeText}
        placeholder={confirmationValue}
        value={value}
      />
      <AppText color={isMatched ? "success" : "textSecondary"} variant="caption">
        {helperText}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});

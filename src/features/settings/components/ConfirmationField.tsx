import { StyleSheet, View } from "react-native";

import { AppText, Icon, TextField } from "@/components/ui";
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
        leftIcon="key-outline"
        onChangeText={onChangeText}
        placeholder={confirmationValue}
        value={value}
      />
      <View style={styles.helperRow}>
        {isMatched ? <Icon color="success" name="checkmark-circle" size={14} /> : null}
        <AppText color={isMatched ? "success" : "textSecondary"} variant="caption">
          {helperText}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  helperRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
});

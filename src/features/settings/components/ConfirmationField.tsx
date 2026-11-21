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
  const isMatched = value.trim() === confirmationValue;

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
      {isMatched ? (
        <View style={styles.helperRow}>
          <Icon color="success" name="checkmark-circle" size={14} />
          <AppText color="success" variant="caption">
            Confirmation matches.
          </AppText>
        </View>
      ) : null}
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

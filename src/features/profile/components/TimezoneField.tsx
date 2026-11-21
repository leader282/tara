import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Button, TextField } from "@/components/ui";
import { getDeviceTimeZone } from "@/lib/dates/timezone";
import { spacing } from "@/theme/tokens";

type TimezoneFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  errorMessage?: string;
};

export function TimezoneField({ value, onChange, onBlur, errorMessage }: TimezoneFieldProps) {
  const deviceTimeZone = useMemo(() => getDeviceTimeZone(), []);
  const isUsingDeviceTimeZone = value.trim() === deviceTimeZone;

  return (
    <View style={styles.container}>
      <TextField
        accessibilityLabel="Timezone"
        autoCapitalize="none"
        autoCorrect={false}
        errorMessage={errorMessage}
        helperText="Your partner sees your local time from this."
        label="Timezone"
        leftIcon="globe-outline"
        onBlur={onBlur}
        onChangeText={onChange}
        placeholder="Asia/Kolkata"
        returnKeyType="next"
        value={value}
      />
      {!isUsingDeviceTimeZone ? (
        <Button
          icon="sync-outline"
          onPress={() => onChange(deviceTimeZone)}
          size="sm"
          style={styles.deviceButton}
          title={`Use this device's time zone (${deviceTimeZone})`}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  deviceButton: {
    alignSelf: "flex-start",
  },
});

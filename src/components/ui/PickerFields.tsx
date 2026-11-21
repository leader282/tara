import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CalendarPicker } from "@/components/ui/CalendarPicker";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TimePicker } from "@/components/ui/TimePicker";
import { formatDateKey, formatTimeKey } from "@/lib/dates/calendar";
import { colors, radii, spacing } from "@/theme/tokens";

type FieldButtonProps = {
  label: string;
  displayValue: string | null;
  placeholder: string;
  icon: IconName;
  onPress: () => void;
  errorMessage?: string;
  helperText?: string;
  disabled?: boolean;
  isOpen: boolean;
  accessibilityLabel?: string;
};

function FieldButton({
  label,
  displayValue,
  placeholder,
  icon,
  onPress,
  errorMessage,
  helperText,
  disabled = false,
  isOpen,
  accessibilityLabel,
}: FieldButtonProps) {
  const supportingText = errorMessage ?? helperText;

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityHint="Opens a picker"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen }}
        accessibilityValue={{ text: displayValue ?? "Not set" }}
        disabled={disabled}
        onPress={() => {
          // Blur the focused text field first: otherwise Android hands focus back to it when
          // the sheet closes, and the keyboard pops up over the form again.
          Keyboard.dismiss();
          onPress();
        }}
        style={({ pressed }) => [
          styles.shell,
          isOpen ? styles.shellFocused : null,
          errorMessage ? styles.shellError : null,
          disabled ? styles.shellDisabled : null,
          pressed ? styles.shellPressed : null,
        ]}
      >
        <Icon color={isOpen ? "primary" : "textTertiary"} name={icon} size={18} />
        <AppText
          color={displayValue ? "textPrimary" : "textTertiary"}
          numberOfLines={1}
          style={styles.value}
          variant="body"
        >
          {displayValue ?? placeholder}
        </AppText>
        <Icon color="textTertiary" name="chevron-down" size={18} />
      </Pressable>
      {supportingText ? (
        <View style={styles.supportRow}>
          {errorMessage ? <Icon color="danger" name="alert-circle" size={14} /> : null}
          <AppText color={errorMessage ? "danger" : "textSecondary"} style={styles.supportText} variant="caption">
            {supportingText}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  helperText?: string;
  minDate?: string;
  maxDate?: string;
  clearable?: boolean;
  disabled?: boolean;
  sheetTitle?: string;
  accessibilityLabel?: string;
};

export function DateField({
  label,
  value,
  onChange,
  placeholder = "Choose a date",
  errorMessage,
  helperText,
  minDate,
  maxDate,
  clearable = false,
  disabled = false,
  sheetTitle,
  accessibilityLabel,
}: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FieldButton
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        displayValue={formatDateKey(value)}
        errorMessage={errorMessage}
        helperText={helperText}
        icon="calendar-outline"
        isOpen={isOpen}
        label={label}
        onPress={() => setIsOpen(true)}
        placeholder={placeholder}
      />
      <BottomSheet
        footer={
          clearable && value ? (
            <Button
              onPress={() => {
                onChange("");
                setIsOpen(false);
              }}
              size="md"
              title="Clear date"
              variant="ghost"
            />
          ) : null
        }
        onClose={() => setIsOpen(false)}
        title={sheetTitle ?? label}
        visible={isOpen}
      >
        <CalendarPicker
          maxDate={maxDate}
          minDate={minDate}
          onSelect={(dateKey) => {
            onChange(dateKey);
            setIsOpen(false);
          }}
          value={value || null}
        />
      </BottomSheet>
    </>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  helperText?: string;
  defaultTime?: string;
  clearable?: boolean;
  disabled?: boolean;
  sheetTitle?: string;
  accessibilityLabel?: string;
};

export function TimeField({
  label,
  value,
  onChange,
  placeholder = "Choose a time",
  errorMessage,
  helperText,
  defaultTime = "09:00",
  clearable = false,
  disabled = false,
  sheetTitle,
  accessibilityLabel,
}: TimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value || defaultTime);

  const open = () => {
    setDraft(value || defaultTime);
    setIsOpen(true);
  };

  return (
    <>
      <FieldButton
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        displayValue={formatTimeKey(value)}
        errorMessage={errorMessage}
        helperText={helperText}
        icon="time-outline"
        isOpen={isOpen}
        label={label}
        onPress={open}
        placeholder={placeholder}
      />
      <BottomSheet
        footer={
          <View style={styles.sheetActions}>
            {clearable && value ? (
              <Button
                onPress={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                size="md"
                style={styles.sheetAction}
                title="Clear"
                variant="outline"
              />
            ) : null}
            <Button
              onPress={() => {
                onChange(draft);
                setIsOpen(false);
              }}
              size="md"
              style={styles.sheetAction}
              title="Done"
            />
          </View>
        }
        onClose={() => setIsOpen(false)}
        title={sheetTitle ?? label}
        visible={isOpen}
      >
        <TimePicker onChange={setDraft} value={draft} />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  shell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  shellFocused: {
    borderColor: colors.primary,
    boxShadow: "0px 0px 0px 3px rgba(184, 82, 74, 0.14)",
  },
  shellError: {
    borderColor: colors.danger,
  },
  shellDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.7,
  },
  shellPressed: {
    backgroundColor: "#FDF9F7",
  },
  value: {
    flex: 1,
  },
  supportRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  supportText: {
    flexShrink: 1,
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sheetAction: {
    flex: 1,
  },
});

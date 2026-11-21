import { useCallback, useRef, useState, type Ref } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radii, spacing } from "@/theme/tokens";
import { textVariants } from "@/theme/typography";

export type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
  helperText?: string;
  showCount?: boolean;
  leftIcon?: IconName;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: Ref<TextInput>;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref && typeof ref === "object") {
    (ref as { current: T | null }).current = value;
  }
}

export function TextField({
  label,
  errorMessage,
  helperText,
  showCount = false,
  leftIcon,
  containerStyle,
  style,
  secureTextEntry,
  multiline,
  editable = true,
  maxLength,
  value,
  onFocus,
  onBlur,
  ref,
  ...props
}: TextFieldProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);
  const isSecureField = Boolean(secureTextEntry);
  const characterCount = value?.length ?? 0;
  const supportingText = errorMessage ?? helperText;

  const setInputRef = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps["onBlur"] = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable accessible={false} onPress={() => inputRef.current?.focus()}>
        <AppText color="textPrimary" variant="label">
          {label}
        </AppText>
      </Pressable>

      <View
        style={[
          styles.inputShell,
          multiline ? styles.inputShellMultiline : null,
          isFocused ? styles.inputShellFocused : null,
          errorMessage ? styles.inputShellError : null,
          !editable ? styles.inputShellDisabled : null,
        ]}
      >
        {leftIcon ? (
          <Icon
            color={isFocused ? "primary" : "textTertiary"}
            name={leftIcon}
            size={18}
            style={multiline ? styles.leftIconMultiline : null}
          />
        ) : null}
        <TextInput
          {...props}
          cursorColor={colors.primary}
          editable={editable}
          maxLength={maxLength}
          multiline={multiline}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholderTextColor={colors.textTertiary}
          ref={setInputRef}
          secureTextEntry={isSecureField && !isSecureTextVisible}
          selectionColor={Platform.OS === "ios" ? colors.primary : "rgba(184, 82, 74, 0.35)"}
          style={[styles.input, multiline ? styles.inputMultiline : null, style]}
          textAlignVertical={multiline ? "top" : "center"}
          value={value}
        />
        {isSecureField ? (
          <Pressable
            accessibilityLabel={isSecureTextVisible ? "Hide password" : "Show password"}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setIsSecureTextVisible((current) => !current)}
            style={styles.trailingAction}
          >
            <Icon
              color="textTertiary"
              name={isSecureTextVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>

      {supportingText || (showCount && maxLength) ? (
        <View style={styles.supportRow}>
          {supportingText ? (
            <View style={styles.supportTextRow}>
              {errorMessage ? <Icon color="danger" name="alert-circle" size={14} /> : null}
              <AppText
                color={errorMessage ? "danger" : "textSecondary"}
                style={styles.supportText}
                variant="caption"
              >
                {supportingText}
              </AppText>
            </View>
          ) : (
            <View style={styles.supportTextRow} />
          )}
          {showCount && maxLength ? (
            <AppText color="textTertiary" variant="caption">
              {characterCount}/{maxLength}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  inputShell: {
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
  inputShellMultiline: {
    alignItems: "flex-start",
  },
  inputShellFocused: {
    borderColor: colors.primary,
    boxShadow: "0px 0px 0px 3px rgba(184, 82, 74, 0.14)",
  },
  inputShellError: {
    borderColor: colors.danger,
  },
  inputShellDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    ...textVariants.body,
    color: colors.textPrimary,
    flex: 1,
    includeFontPadding: false,
    minHeight: 50,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 104,
    paddingBottom: 12,
    paddingTop: 13,
  },
  leftIconMultiline: {
    marginTop: 15,
  },
  trailingAction: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 32,
  },
  supportRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  supportTextRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
  },
  supportText: {
    flexShrink: 1,
  },
});

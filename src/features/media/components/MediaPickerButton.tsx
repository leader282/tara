import { StyleSheet, View } from "react-native";

import { Button, type ButtonVariant } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type MediaPickerButtonProps = {
  onPickFromLibrary: () => void | Promise<void>;
  onTakePhoto: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function MediaPickerButton({
  onPickFromLibrary,
  onTakePhoto,
  disabled = false,
  loading = false,
  variant = "outline",
}: MediaPickerButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <View style={styles.actions}>
      <Button
        accessibilityHint="Opens your library to choose an image"
        accessibilityLabel="Choose a photo from your library"
        disabled={isDisabled}
        icon="images-outline"
        loading={loading}
        onPress={() => {
          void onPickFromLibrary();
        }}
        size="md"
        style={styles.action}
        title="Choose photo"
        variant={variant}
      />
      <Button
        accessibilityHint="Opens the camera to capture an image"
        accessibilityLabel="Take a new photo with camera"
        disabled={isDisabled}
        icon="camera-outline"
        onPress={() => {
          void onTakePhoto();
        }}
        size="md"
        style={styles.action}
        title="Take photo"
        variant={variant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});

import { StyleSheet, View } from "react-native";

import { AppText, Button, type ButtonVariant, Card } from "@/components/ui";
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
  variant = "secondary",
}: MediaPickerButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="bodyMuted">Attach a private photo</AppText>
        <View style={styles.actions}>
          <Button
            accessibilityHint="Opens your library to choose an image"
            accessibilityLabel="Choose a photo from your library"
            disabled={isDisabled}
            loading={loading}
            onPress={() => {
              void onPickFromLibrary();
            }}
            title="Choose photo"
            variant={variant}
          />
          <Button
            accessibilityHint="Opens the camera to capture an image"
            accessibilityLabel="Take a new photo with camera"
            disabled={isDisabled}
            onPress={() => {
              void onTakePhoto();
            }}
            title="Take photo"
            variant="ghost"
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});

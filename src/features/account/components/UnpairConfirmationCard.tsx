import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { LEAVE_COUPLE_CONFIRMATION } from "@/features/account/constants";
import { SettingsDangerZone } from "@/features/settings/components/SettingsDangerZone";
import { ConfirmationField } from "@/features/settings/components/ConfirmationField";
import { spacing } from "@/theme/tokens";

type UnpairConfirmationCardProps = {
  isPaired: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onConfirm: (confirmation: string) => Promise<unknown>;
};

export function UnpairConfirmationCard({
  isPaired,
  isSubmitting,
  errorMessage,
  onConfirm,
}: UnpairConfirmationCardProps) {
  const [confirmation, setConfirmation] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isConfirmationMatched = confirmation.trim() === LEAVE_COUPLE_CONFIRMATION;

  return (
    <SettingsDangerZone
      description="Unpairing archives your shared couple space and removes active access for both partners."
      title="Unpair from couple"
    >
      <View style={styles.consequences}>
        <AppText color="textSecondary" variant="caption">
          - Shared couple space will be archived.
        </AppText>
        <AppText color="textSecondary" variant="caption">
          - Both partners lose active access in MVP.
        </AppText>
        <AppText color="textSecondary" variant="caption">
          - Historical records are not immediately deleted.
        </AppText>
        <AppText color="textSecondary" variant="caption">
          - Export and deletion workflows are separate.
        </AppText>
      </View>

      <ConfirmationField
        confirmationValue={LEAVE_COUPLE_CONFIRMATION}
        disabled={!isPaired || isSubmitting}
        label="Type UNPAIR to continue"
        onChangeText={(value) => {
          setSuccessMessage(null);
          setConfirmation(value);
        }}
        value={confirmation}
      />

      {errorMessage ? (
        <AppText color="danger" variant="caption">
          {errorMessage}
        </AppText>
      ) : null}

      {successMessage ? (
        <AppText color="success" variant="caption">
          {successMessage}
        </AppText>
      ) : null}

      <Button
        disabled={!isPaired || !isConfirmationMatched || isSubmitting}
        loading={isSubmitting}
        onPress={() => {
          const submit = async () => {
            try {
              await onConfirm(confirmation.trim());
              setConfirmation("");
              setSuccessMessage("Couple space archived. Redirecting you now.");
            } catch {
              // Friendly errors are shown from the parent hook.
            }
          };

          void submit();
        }}
        title="Unpair and archive"
        variant="danger"
      />
    </SettingsDangerZone>
  );
}

const styles = StyleSheet.create({
  consequences: {
    gap: spacing.xs,
  },
});

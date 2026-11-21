import { useState } from "react";

import { Button, InlineMessage } from "@/components/ui";
import { ConsequenceList } from "@/features/account/components/ConsequenceList";
import { LEAVE_COUPLE_CONFIRMATION } from "@/features/account/constants";
import { SettingsDangerZone } from "@/features/settings/components/SettingsDangerZone";
import { ConfirmationField } from "@/features/settings/components/ConfirmationField";

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
      icon="heart-dislike-outline"
      title="Unpair from couple"
    >
      <ConsequenceList
        items={[
          "Shared couple space will be archived.",
          "Both partners lose active access in MVP.",
          "Historical records are not immediately deleted.",
          "Export and deletion workflows are separate.",
        ]}
      />

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

      {errorMessage ? <InlineMessage message={errorMessage} tone="danger" /> : null}
      {successMessage ? <InlineMessage message={successMessage} tone="success" /> : null}

      <Button
        disabled={!isPaired || !isConfirmationMatched || isSubmitting}
        icon="heart-dislike-outline"
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

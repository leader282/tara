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

  if (!isPaired && !successMessage) {
    return (
      <SettingsDangerZone icon="heart-dislike-outline" title="Unpair from couple">
        <InlineMessage message="You're not paired with anyone right now." tone="info" />
      </SettingsDangerZone>
    );
  }

  return (
    <SettingsDangerZone
      description="Unpairing archives your shared couple space for both of you."
      icon="heart-dislike-outline"
      title="Unpair from couple"
    >
      <ConsequenceList
        items={[
          "Neither of you can open it afterwards.",
          "Your shared history isn't deleted right away.",
          "Exporting or deleting your data are separate steps.",
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

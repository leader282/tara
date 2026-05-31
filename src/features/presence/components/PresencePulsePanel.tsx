import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, TextField } from "@/components/ui";
import {
  PRESENCE_PULSE_OPTIONS,
  PRESENCE_PULSE_OPTIONS_LIST,
  PRESENCE_PULSE_TYPES,
} from "@/features/presence/constants";
import { PresencePulseButton } from "@/features/presence/components/PresencePulseButton";
import { useSendPresencePulse } from "@/features/presence/hooks/useSendPresencePulse";
import type { PresencePulseType } from "@/features/presence/types";
import { spacing } from "@/theme/tokens";

const SUCCESS_MESSAGE_TIMEOUT_MS = 3000;

type PresencePulsePanelProps = {
  partnerDisplayName?: string;
};

export function PresencePulsePanel({ partnerDisplayName = "your partner" }: PresencePulsePanelProps) {
  const sendPulseMutation = useSendPresencePulse();
  const [selectedType, setSelectedType] = useState<PresencePulseType>(PRESENCE_PULSE_TYPES[0]);
  const [optionalMessage, setOptionalMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSuccessMessage(null);
    }, SUCCESS_MESSAGE_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  const handleSendPulse = async () => {
    try {
      setSuccessMessage(null);

      await sendPulseMutation.mutateAsync({
        type: selectedType,
        optionalMessage,
      });

      setOptionalMessage("");
      setSuccessMessage(`Sent ${PRESENCE_PULSE_OPTIONS[selectedType].shortLabel.toLowerCase()} with care.`);
    } catch {
      // Friendly error is rendered from mutation state.
    }
  };

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="subtitle">Presence pulse</AppText>
          <AppText color="textSecondary" variant="bodyMuted">
            Send {partnerDisplayName} a small signal when you want to feel close.
          </AppText>
        </View>

        <View style={styles.pulseGrid}>
          {PRESENCE_PULSE_OPTIONS_LIST.map((option) => (
            <PresencePulseButton
              key={option.type}
              disabled={sendPulseMutation.isPending}
              loading={sendPulseMutation.isPending && selectedType === option.type}
              onPress={setSelectedType}
              option={option}
              selected={selectedType === option.type}
            />
          ))}
        </View>

        <TextField
          accessibilityLabel="Optional pulse note"
          autoCapitalize="sentences"
          autoCorrect
          editable={!sendPulseMutation.isPending}
          keyboardType="default"
          label="Tiny note (optional)"
          maxLength={240}
          multiline
          onChangeText={setOptionalMessage}
          placeholder="Add a tiny note if you want"
          style={styles.noteInput}
          textAlignVertical="top"
          value={optionalMessage}
        />

        <AppText color="textSecondary" variant="caption">
          {optionalMessage.trim().length}/240
        </AppText>

        {successMessage ? (
          <AppText color="success" variant="caption">
            {successMessage}
          </AppText>
        ) : null}

        {sendPulseMutation.friendlyError ? (
          <AppText color="danger" variant="caption">
            {sendPulseMutation.friendlyError}
          </AppText>
        ) : null}

        <Button
          disabled={sendPulseMutation.isPending}
          loading={sendPulseMutation.isPending}
          onPress={handleSendPulse}
          title="Send pulse"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  pulseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  noteInput: {
    minHeight: 88,
  },
});

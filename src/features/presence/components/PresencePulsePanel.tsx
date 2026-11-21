import { useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";

import { useToast } from "@/components/feedback/ToastProvider";
import { Button, Card, InlineMessage, SectionHeader, TextField } from "@/components/ui";
import {
  PRESENCE_PULSE_OPTIONS,
  PRESENCE_PULSE_OPTIONS_LIST,
  PRESENCE_PULSE_TYPES,
} from "@/features/presence/constants";
import { PresencePulseButton } from "@/features/presence/components/PresencePulseButton";
import { useSendPresencePulse } from "@/features/presence/hooks/useSendPresencePulse";
import type { PresencePulseType } from "@/features/presence/types";
import { spacing } from "@/theme/tokens";

const GRID_CELL_GUTTER = spacing.xs;
const NOTE_MAX_LENGTH = 240;

type PresencePulsePanelProps = {
  partnerDisplayName?: string;
};

export function PresencePulsePanel({ partnerDisplayName = "your partner" }: PresencePulsePanelProps) {
  const toast = useToast();
  const sendPulseMutation = useSendPresencePulse();
  const [selectedType, setSelectedType] = useState<PresencePulseType>(PRESENCE_PULSE_TYPES[0]);
  const [optionalMessage, setOptionalMessage] = useState("");
  const selectedOption = PRESENCE_PULSE_OPTIONS[selectedType];

  const handleSendPulse = async () => {
    const hasNote = optionalMessage.trim().length > 0;

    try {
      await sendPulseMutation.mutateAsync({
        type: selectedType,
        optionalMessage,
      });

      setOptionalMessage("");
      Keyboard.dismiss();
      toast.show({
        tone: "success",
        emoji: selectedOption.emoji,
        title: selectedOption.sentTitle(partnerDisplayName),
        message: hasNote
          ? `${selectedOption.sentMessage} Your note went along with it.`
          : selectedOption.sentMessage,
      });
    } catch {
      // Friendly error is rendered from mutation state.
    }
  };

  return (
    <Card>
      <View style={styles.container}>
        <SectionHeader
          description={`Let ${partnerDisplayName} feel you close, in a single tap.`}
          title="Send a little love"
        />

        <View style={styles.grid}>
          {PRESENCE_PULSE_OPTIONS_LIST.map((option) => (
            <View key={option.type} style={styles.gridCell}>
              <PresencePulseButton
                disabled={sendPulseMutation.isPending}
                onPress={setSelectedType}
                option={option}
                selected={selectedType === option.type}
              />
            </View>
          ))}
        </View>

        <TextField
          accessibilityLabel="Optional pulse note"
          autoCapitalize="sentences"
          autoCorrect
          editable={!sendPulseMutation.isPending}
          keyboardType="default"
          label="Tiny note (optional)"
          maxLength={NOTE_MAX_LENGTH}
          multiline
          onChangeText={setOptionalMessage}
          placeholder={`Something just for ${partnerDisplayName}...`}
          showCount
          style={styles.noteInput}
          value={optionalMessage}
        />

        {sendPulseMutation.friendlyError ? (
          <InlineMessage message={sendPulseMutation.friendlyError} tone="danger" />
        ) : null}

        <Button
          accessibilityLabel={`Send ${selectedOption.label.toLowerCase()} to ${partnerDisplayName}`}
          disabled={sendPulseMutation.isPending}
          loading={sendPulseMutation.isPending}
          onPress={handleSendPulse}
          title={`Send ${selectedOption.emoji} to ${partnerDisplayName}`}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    margin: -GRID_CELL_GUTTER,
  },
  gridCell: {
    padding: GRID_CELL_GUTTER,
    width: "25%",
  },
  noteInput: {
    minHeight: 76,
  },
});

import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider, useToast } from "@/components/feedback/ToastProvider";

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function ShowToastButton({ onPress }: { onPress: () => void }) {
  const toast = useToast();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        toast.show({
          tone: "love",
          emoji: "🤗",
          title: "Mona sent you a hug",
          message: "Wrapped up warm and sent across the miles.",
          actionLabel: "Reply",
          onPress,
        })
      }
    >
      <Text>Show</Text>
    </Pressable>
  );
}

describe("ToastProvider", () => {
  it("shows a vivid banner and runs its action when tapped", () => {
    jest.useFakeTimers();
    const onPress = jest.fn();

    render(
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <ToastProvider>
          <ShowToastButton onPress={onPress} />
        </ToastProvider>
      </SafeAreaProvider>,
    );

    fireEvent.press(screen.getByRole("button", { name: "Show" }));

    expect(screen.getByText("Mona sent you a hug")).toBeTruthy();
    expect(screen.getByText("Wrapped up warm and sent across the miles.")).toBeTruthy();
    expect(screen.getByText("Reply")).toBeTruthy();

    fireEvent.press(screen.getByRole("alert"));
    expect(onPress).toHaveBeenCalledTimes(1);

    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });
});

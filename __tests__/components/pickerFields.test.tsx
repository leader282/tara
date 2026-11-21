import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Keyboard } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DateField, TimeField } from "@/components/ui";

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function MeetupFields() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  return (
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <DateField
        accessibilityLabel="Meetup date"
        label="Meetup date"
        minDate="2026-11-19"
        onChange={setDate}
        sheetTitle="When will you be together?"
        value={date}
      />
      <TimeField
        accessibilityLabel="Meetup time"
        defaultTime="12:00"
        label="Meetup time (optional)"
        onChange={setTime}
        sheetTitle="What time?"
        value={time}
      />
    </SafeAreaProvider>
  );
}

function settleAnimations() {
  act(() => {
    jest.runAllTimers();
  });
}

describe("picker fields", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 19, 9, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens the calendar on the first tap, keeps past days disabled, and shows the picked date", () => {
    render(<MeetupFields />);
    settleAnimations();

    fireEvent.press(screen.getByLabelText("Meetup date"));
    expect(screen.getByText("When will you be together?")).toBeTruthy();
    expect(screen.getByLabelText("November 18, 2026").props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.press(screen.getByLabelText("November 26, 2026"));
    settleAnimations();

    expect(screen.getByText("Thu, Nov 26, 2026")).toBeTruthy();
    expect(screen.queryByText("When will you be together?")).toBeNull();

    fireEvent.press(screen.getByLabelText("Meetup date"));
    expect(screen.getByText("When will you be together?")).toBeTruthy();
  });

  it("applies a picked time only when Done is pressed", () => {
    render(<MeetupFields />);
    settleAnimations();

    fireEvent.press(screen.getByLabelText("Meetup time"));
    fireEvent.press(screen.getByLabelText("6 o'clock"));
    fireEvent.press(screen.getByLabelText("30 minutes"));
    expect(screen.getByText("Choose a time")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Done" }));
    settleAnimations();

    expect(screen.getByText("6:30 PM")).toBeTruthy();
    expect(screen.queryByText("What time?")).toBeNull();
  });

  it("closes the keyboard before opening a picker so it doesn't return when the sheet closes", () => {
    const dismissKeyboard = jest.spyOn(Keyboard, "dismiss");
    render(<MeetupFields />);
    settleAnimations();

    fireEvent.press(screen.getByLabelText("Meetup date"));
    expect(dismissKeyboard).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText("November 26, 2026"));
    settleAnimations();
    fireEvent.press(screen.getByLabelText("Meetup time"));
    expect(dismissKeyboard).toHaveBeenCalledTimes(2);

    dismissKeyboard.mockRestore();
  });
});

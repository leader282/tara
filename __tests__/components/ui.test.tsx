import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { Button, EmptyState, ErrorState, TextField } from "@/components/ui";

describe("UI primitives", () => {
  it("renders Button in disabled state and blocks presses", () => {
    const onPress = jest.fn();

    render(<Button disabled onPress={onPress} title="Save" />);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });

    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders Button in loading state as busy", () => {
    render(<Button loading onPress={jest.fn()} title="Saving" />);

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(screen.queryByText("Saving")).toBeNull();
  });

  it("renders TextField with accessible label and change handler", () => {
    const onChangeText = jest.fn();

    render(
      <TextField
        accessibilityLabel="Display name input"
        label="Display name"
        onChangeText={onChangeText}
        value=""
      />,
    );

    const input = screen.getByLabelText("Display name input");
    fireEvent.changeText(input, "Levi");

    expect(onChangeText).toHaveBeenCalledWith("Levi");
    expect(screen.getByText("Display name")).toBeTruthy();
  });

  it("renders ErrorState and retry action", () => {
    const onRetry = jest.fn();

    render(
      <ErrorState
        message="Something failed."
        onRetry={onRetry}
        retryLabel="Retry now"
        title="Oops"
      />,
    );

    expect(screen.getByText("Oops")).toBeTruthy();
    expect(screen.getByText("Something failed.")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Retry now" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders EmptyState with optional action", () => {
    const onActionPress = jest.fn();

    render(
      <EmptyState
        actionLabel="Create one"
        description="No entries yet."
        onActionPress={onActionPress}
        title="Nothing here"
      />,
    );

    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.getByText("No entries yet.")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Create one" }));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});

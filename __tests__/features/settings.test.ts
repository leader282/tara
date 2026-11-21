import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { ConfirmationField } from "@/features/settings/components/ConfirmationField";

describe("settings feature logic", () => {
  it("shows no confirmation until the text matches", () => {
    render(
      React.createElement(ConfirmationField, {
        confirmationValue: "UNPAIR",
        label: "Type UNPAIR to continue",
        onChangeText: jest.fn(),
        value: "UNPAI",
      }),
    );

    expect(screen.getByText("Type UNPAIR to continue")).toBeTruthy();
    expect(screen.queryByText("Confirmation matches.")).toBeNull();
  });

  it("shows matched confirmation state after trimming input", () => {
    render(
      React.createElement(ConfirmationField, {
        confirmationValue: "DELETE",
        label: "Type confirmation",
        onChangeText: jest.fn(),
        value: "  DELETE  ",
      }),
    );

    expect(screen.getByText("Confirmation matches.")).toBeTruthy();
  });
});

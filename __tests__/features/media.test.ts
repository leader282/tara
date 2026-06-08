import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { MediaUploadProgress } from "@/features/media/components/MediaUploadProgress";

describe("media feature logic", () => {
  it("renders nothing when progress is absent", () => {
    const { toJSON } = render(React.createElement(MediaUploadProgress, { progress: null }));

    expect(toJSON()).toBeNull();
  });

  it("maps uploading state to a stable status label", () => {
    render(
      React.createElement(MediaUploadProgress, {
        progress: {
          step: "uploading",
          message: null,
          errorCode: null,
        },
      }),
    );

    expect(screen.getByText("Uploading photo")).toBeTruthy();
  });

  it("maps success state to uploaded label", () => {
    render(
      React.createElement(MediaUploadProgress, {
        progress: {
          step: "success",
          message: null,
          errorCode: null,
        },
      }),
    );

    expect(screen.getByText("Uploaded")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry upload" })).toBeNull();
  });

  it("maps error state and exposes retry action", () => {
    const onRetry = jest.fn();

    render(
      React.createElement(MediaUploadProgress, {
        onRetry,
        progress: {
          step: "error",
          message: "Upload failed, try again.",
          errorCode: "upload_failed",
        },
      }),
    );

    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Upload failed, try again.")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Retry upload" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

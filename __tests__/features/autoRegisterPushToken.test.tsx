import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

const mockPermission = { isGranted: true };
const mockRegisterDevice = jest.fn(async (_input: unknown) => ({}));
const mockUpsertPreferences = jest.fn(async (_input: unknown) => ({}));

jest.mock("@/features/notifications/services/notificationPermissions", () => ({
  getNotificationPermissionStatus: async () => ({
    status: mockPermission.isGranted ? "granted" : "undetermined",
    isGranted: mockPermission.isGranted,
    canAskAgain: true,
  }),
}));

jest.mock("@/features/notifications/services/notificationToken", () => ({
  registerCurrentDeviceForPush: (input: unknown) => mockRegisterDevice(input),
}));

jest.mock("@/features/notifications/api/notificationsApi", () => ({
  registerPushToken: jest.fn(),
  upsertNotificationPreferences: (input: unknown) => mockUpsertPreferences(input),
}));

import { useAutoRegisterPushToken } from "@/features/notifications/hooks/useAutoRegisterPushToken";

const USER_ID = "55555555-5555-4555-8555-555555555555";
const appStateListeners: ((state: AppStateStatus) => void)[] = [];

function AutoRegister({ userId }: { userId: string | null }) {
  useAutoRegisterPushToken(userId);
  return null;
}

function returnToApp() {
  act(() => {
    for (const listener of appStateListeners) {
      listener("active");
    }
  });
}

describe("automatic push registration", () => {
  beforeEach(() => {
    mockPermission.isGranted = true;
    mockRegisterDevice.mockClear();
    mockUpsertPreferences.mockClear();
    appStateListeners.length = 0;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      appStateListeners.push(listener as (state: AppStateStatus) => void);
      return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
    });
  });

  it("registers the phone when notifications are already allowed", async () => {
    render(<AutoRegister userId={USER_ID} />);

    await waitFor(() => expect(mockRegisterDevice).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockUpsertPreferences).toHaveBeenCalledWith({ userId: USER_ID }));
  });

  it("waits for permission, then registers when the user comes back to the app", async () => {
    mockPermission.isGranted = false;
    render(<AutoRegister userId={USER_ID} />);
    await act(async () => {});
    expect(mockRegisterDevice).not.toHaveBeenCalled();

    mockPermission.isGranted = true;
    returnToApp();

    await waitFor(() => expect(mockRegisterDevice).toHaveBeenCalledTimes(1));
  });

  it("registers once per session", async () => {
    render(<AutoRegister userId={USER_ID} />);
    await waitFor(() => expect(mockUpsertPreferences).toHaveBeenCalledTimes(1));

    returnToApp();
    returnToApp();
    await act(async () => {});

    expect(mockRegisterDevice).toHaveBeenCalledTimes(1);
  });

  it("does nothing while signed out", async () => {
    render(<AutoRegister userId={null} />);
    await act(async () => {});

    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });
});

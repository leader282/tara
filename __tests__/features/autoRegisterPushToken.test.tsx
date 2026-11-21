import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

// Android 13+ reports a permission it has never asked for as "denied" with canAskAgain, and
// still lets the app ask again after the first "no".
const mockPermission = { granted: true, canAskAgain: true, answer: true };
const mockStorage = new Map<string, string>();
const mockRegisterDevice = jest.fn(async (_input: unknown) => ({}));
const mockUpsertPreferences = jest.fn(async (_input: unknown) => ({}));
const mockRequestPermission = jest.fn(async () => {
  mockPermission.granted = mockPermission.answer;
  return {
    status: mockPermission.granted ? "granted" : "denied",
    isGranted: mockPermission.granted,
    canAskAgain: mockPermission.canAskAgain,
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: async (key: string) => mockStorage.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    mockStorage.set(key, value);
  },
}));

jest.mock("@/features/notifications/services/notificationPermissions", () => ({
  getNotificationPermissionStatus: async () => ({
    status: mockPermission.granted ? "granted" : "denied",
    isGranted: mockPermission.granted,
    canAskAgain: mockPermission.canAskAgain,
  }),
  requestNotificationPermission: () => mockRequestPermission(),
}));

jest.mock("@/features/notifications/services/notificationToken", () => ({
  registerCurrentDeviceForPush: (input: unknown) => mockRegisterDevice(input),
}));

jest.mock("@/features/notifications/api/notificationsApi", () => ({
  registerPushToken: jest.fn(),
  upsertNotificationPreferences: (input: unknown) => mockUpsertPreferences(input),
}));

import {
  NOTIFICATION_PROMPT_SHOWN_KEY,
  useAutoRegisterPushToken,
} from "@/features/notifications/hooks/useAutoRegisterPushToken";

const USER_ID = "55555555-5555-4555-8555-555555555555";
const appStateListeners: ((state: AppStateStatus) => void)[] = [];

function AutoRegister({ userId, askIfNeverAsked = false }: { userId: string | null; askIfNeverAsked?: boolean }) {
  useAutoRegisterPushToken(userId, { askIfNeverAsked });
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
    mockPermission.granted = true;
    mockPermission.canAskAgain = true;
    mockPermission.answer = true;
    mockStorage.clear();
    mockRegisterDevice.mockClear();
    mockUpsertPreferences.mockClear();
    mockRequestPermission.mockClear();
    appStateListeners.length = 0;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      appStateListeners.push(listener as (state: AppStateStatus) => void);
      return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
    });
  });

  it("registers the phone when notifications are already allowed", async () => {
    render(<AutoRegister askIfNeverAsked userId={USER_ID} />);

    await waitFor(() => expect(mockRegisterDevice).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockUpsertPreferences).toHaveBeenCalledWith({ userId: USER_ID }));
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it("asks on first use and registers when the user says yes", async () => {
    mockPermission.granted = false;
    render(<AutoRegister askIfNeverAsked userId={USER_ID} />);

    await waitFor(() => expect(mockRegisterDevice).toHaveBeenCalledTimes(1));
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockStorage.has(NOTIFICATION_PROMPT_SHOWN_KEY)).toBe(true);
  });

  it("doesn't ask before onboarding is finished", async () => {
    mockPermission.granted = false;
    render(<AutoRegister userId={USER_ID} />);
    await act(async () => {});

    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });

  it("doesn't ask again after the user says no, even though Android would allow it", async () => {
    mockPermission.granted = false;
    mockPermission.answer = false;
    render(<AutoRegister askIfNeverAsked userId={USER_ID} />);
    await waitFor(() => expect(mockRequestPermission).toHaveBeenCalledTimes(1));

    returnToApp();
    await act(async () => {});

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });

  it("doesn't ask on later launches once it has asked", async () => {
    mockPermission.granted = false;
    mockStorage.set(NOTIFICATION_PROMPT_SHOWN_KEY, "2026-11-21T00:00:00.000Z");
    render(<AutoRegister askIfNeverAsked userId={USER_ID} />);
    await act(async () => {});

    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it("doesn't ask when the phone no longer shows the prompt", async () => {
    mockPermission.granted = false;
    mockPermission.canAskAgain = false;
    render(<AutoRegister askIfNeverAsked userId={USER_ID} />);
    await act(async () => {});

    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockStorage.has(NOTIFICATION_PROMPT_SHOWN_KEY)).toBe(false);
  });

  it("registers after the user allows notifications in system settings", async () => {
    mockPermission.granted = false;
    render(<AutoRegister userId={USER_ID} />);
    await act(async () => {});
    expect(mockRegisterDevice).not.toHaveBeenCalled();

    mockPermission.granted = true;
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

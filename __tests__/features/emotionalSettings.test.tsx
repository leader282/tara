import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const mockSettingsProfile = {
  profile: {
    id: USER_ID,
    display_name: "Asha",
    timezone: "Asia/Kolkata",
    city: "Mumbai",
    country: "India",
    birthday: null,
  },
  userSettings: {
    user_id: USER_ID,
    emotional_tone: "playful",
    notification_tone: "minimal",
    preferred_love_signals: ["thinking_of_you", "shared_photos", "memory_capsules"],
    quiet_hours_start: null,
    quiet_hours_end: null,
  },
};
const mockQuery = { loaded: false };

jest.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "11111111-1111-4111-8111-111111111111" } }),
}));

jest.mock("@/features/settings/hooks/useSettingsProfile", () => ({
  useSettingsProfile: () =>
    mockQuery.loaded
      ? { data: mockSettingsProfile, error: null, isFetched: true, isLoading: false, refetch: jest.fn() }
      : { data: undefined, error: null, isFetched: false, isLoading: true, refetch: jest.fn() },
}));

jest.mock("@/features/settings/hooks/useUpdateSettingsProfile", () => ({
  useUpdateSettingsProfile: () => ({
    friendlyError: null,
    isPending: false,
    mutateAsync: jest.fn(async () => mockSettingsProfile),
  }),
}));

jest.mock("@/components/navigation/useGoBack", () => ({
  useGoBack: () => jest.fn(),
}));

import { ToastProvider } from "@/components/feedback/ToastProvider";
import { EmotionalSettingsScreen } from "@/features/settings/screens/EmotionalSettingsScreen";

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function settle() {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function renderScreen() {
  return (
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ToastProvider>
        <EmotionalSettingsScreen />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

describe("emotional settings", () => {
  it("enables saving after a tone change even when settings were still loading on open", async () => {
    mockQuery.loaded = false;
    const view = render(renderScreen());
    await settle();

    mockQuery.loaded = true;
    view.rerender(renderScreen());
    await settle();

    const saveButton = () => screen.getByRole("button", { name: "Save emotional preferences" });
    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(screen.getByLabelText("Romantic"));
    await settle();

    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: false });
  });
});

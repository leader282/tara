import { afterEach, jest } from "@jest/globals";
import { cleanup } from "@testing-library/react-native";

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

jest.mock("expo-font", () => ({
  ...jest.requireActual<typeof import("expo-font")>("expo-font"),
  isLoaded: () => true,
}));

afterEach(() => {
  cleanup();
});

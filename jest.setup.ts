import { afterEach, jest } from "@jest/globals";
import { cleanup } from "@testing-library/react-native";

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

jest.mock("expo-font", () => ({
  ...jest.requireActual<typeof import("expo-font")>("expo-font"),
  isLoaded: () => true,
}));

jest.mock("expo-video", () => ({
  VideoView: () => null,
  useVideoPlayer: () => ({}),
}));

jest.mock("expo-camera", () => ({
  CameraView: () => null,
  useCameraPermissions: () => [null, jest.fn()],
  useMicrophonePermissions: () => [null, jest.fn()],
}));

afterEach(() => {
  cleanup();
});

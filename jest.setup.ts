import { afterEach } from "@jest/globals";
import { cleanup } from "@testing-library/react-native";

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

afterEach(() => {
  cleanup();
});

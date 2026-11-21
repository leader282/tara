import { useEffect, useState, type RefObject } from "react";
import { Keyboard, Platform, type View } from "react-native";

/**
 * Android only: edge-to-edge windows no longer resize for the keyboard, so screens pad
 * themselves by how far the keyboard overlaps them. iOS scroll views adjust natively.
 */
export function useKeyboardOverlap(containerRef: RefObject<View | null>, enabled = true): number {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android" || !enabled) {
      return;
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      container.measureInWindow((_x, y, _width, height) => {
        setOverlap(Math.max(0, Math.round(y + height - event.endCoordinates.screenY)));
      });
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setOverlap(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [containerRef, enabled]);

  return enabled ? overlap : 0;
}

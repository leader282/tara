import { useCallback, useEffect, useRef, useState } from "react";

import type { IncomingPulseState, RecentPresencePulse } from "@/features/presence/types";

const DEFAULT_AUTO_DISMISS_MS = 5000;
const TOAST_HIDE_ANIMATION_MS = 180;

export function useIncomingPulseToast(autoDismissMs = DEFAULT_AUTO_DISMISS_MS) {
  const [state, setState] = useState<IncomingPulseState>({
    isVisible: false,
    pulse: null,
  });
  const autoDismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (autoDismissTimeoutRef.current) {
      clearTimeout(autoDismissTimeoutRef.current);
      autoDismissTimeoutRef.current = null;
    }

    if (clearPulseTimeoutRef.current) {
      clearTimeout(clearPulseTimeoutRef.current);
      clearPulseTimeoutRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    if (clearPulseTimeoutRef.current) {
      clearTimeout(clearPulseTimeoutRef.current);
    }

    setState((current) => ({
      ...current,
      isVisible: false,
    }));

    clearPulseTimeoutRef.current = setTimeout(() => {
      setState((current) => ({
        isVisible: false,
        pulse: current.isVisible ? current.pulse : null,
      }));
      clearPulseTimeoutRef.current = null;
    }, TOAST_HIDE_ANIMATION_MS);
  }, []);

  const clear = useCallback(() => {
    clearTimers();
    setState({
      isVisible: false,
      pulse: null,
    });
  }, [clearTimers]);

  const showIncomingPulse = useCallback(
    (pulse: RecentPresencePulse) => {
      clearTimers();

      setState({
        isVisible: true,
        pulse,
      });

      autoDismissTimeoutRef.current = setTimeout(() => {
        autoDismissTimeoutRef.current = null;
        dismiss();
      }, autoDismissMs);
    },
    [autoDismissMs, clearTimers, dismiss]
  );

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    state,
    isVisible: state.isVisible,
    pulse: state.pulse,
    showIncomingPulse,
    dismiss,
    clear,
  };
}

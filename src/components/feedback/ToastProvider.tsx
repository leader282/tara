import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, gradients, layout, radii, shadows, spacing, type ColorName } from "@/theme/tokens";

export type ToastTone = "success" | "info" | "warning" | "danger" | "love";

export type ToastOptions = {
  title: string;
  message?: string;
  tone?: ToastTone;
  emoji?: string;
  icon?: IconName;
  durationMs?: number;
  actionLabel?: string;
  onPress?: () => void;
};

type ActiveToast = ToastOptions & { key: number };

type ToastContextValue = {
  show: (options: ToastOptions) => void;
  hide: () => void;
};

const noop = () => {};
const ToastContext = createContext<ToastContextValue>({ show: noop, hide: noop });

const DEFAULT_DURATION_MS = 4000;
const LOVE_DURATION_MS = 6000;
const HIDDEN_OFFSET = -160;

const toneStyles: Record<
  Exclude<ToastTone, "love">,
  { iconBackground: string; icon: IconName; iconColor: ColorName }
> = {
  success: { iconBackground: colors.successSoft, icon: "checkmark-circle", iconColor: "success" },
  info: { iconBackground: colors.infoSoft, icon: "information-circle", iconColor: "info" },
  warning: { iconBackground: colors.warningSoft, icon: "alert-circle", iconColor: "warning" },
  danger: { iconBackground: colors.dangerSoft, icon: "alert-circle", iconColor: "danger" },
};

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

type ToastCardProps = {
  toast: ActiveToast;
  translateY: Animated.Value;
  opacity: Animated.Value;
  badgeScale: Animated.Value;
  topInset: number;
  onDismiss: () => void;
};

function ToastCard({ toast, translateY, opacity, badgeScale, topInset, onDismiss }: ToastCardProps) {
  const isLove = toast.tone === "love";
  const toneStyle = toast.tone !== "love" ? toneStyles[toast.tone ?? "success"] : null;

  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_event, gesture) => {
        translateY.setValue(Math.min(gesture.dy, 12));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy < -24 || gesture.vy < -0.6) {
          onDismiss();
          return;
        }

        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  );

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.host, { opacity, paddingTop: topInset + spacing.sm, transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <Pressable
        accessibilityHint={toast.onPress ? "Opens the related screen" : "Dismisses this message"}
        accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}
        accessibilityRole="alert"
        onPress={() => {
          toast.onPress?.();
          onDismiss();
        }}
        style={({ pressed }) => [
          styles.toast,
          isLove ? styles.toastLove : null,
          pressed ? styles.toastPressed : null,
        ]}
      >
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: isLove ? "rgba(255, 255, 255, 0.18)" : toneStyle?.iconBackground },
            { transform: [{ scale: badgeScale }] },
          ]}
        >
          {toast.emoji ? (
            <AppText style={styles.emoji}>{toast.emoji}</AppText>
          ) : (
            <Icon
              color={isLove ? "inkText" : (toneStyle?.iconColor ?? "success")}
              name={toast.icon ?? toneStyle?.icon ?? "heart"}
              size={22}
            />
          )}
        </Animated.View>
        <View style={styles.copy}>
          <AppText
            color={isLove ? "inkText" : "textPrimary"}
            numberOfLines={2}
            style={styles.title}
            variant="label"
          >
            {toast.title}
          </AppText>
          {toast.message ? (
            <AppText color={isLove ? "inkMuted" : "textSecondary"} numberOfLines={3} variant="caption">
              {toast.message}
            </AppText>
          ) : null}
        </View>
        {toast.actionLabel ? (
          <View style={[styles.action, isLove ? styles.actionLove : null]}>
            <AppText color={isLove ? "inkText" : "primary"} variant="label">
              {toast.actionLabel}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const keyRef = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [translateY] = useState(() => new Animated.Value(HIDDEN_OFFSET));
  const [opacity] = useState(() => new Animated.Value(0));
  const [badgeScale] = useState(() => new Animated.Value(0.4));

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearDismissTimer();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: HIDDEN_OFFSET,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [clearDismissTimer, opacity, translateY]);

  const show = useCallback(
    (options: ToastOptions) => {
      clearDismissTimer();
      keyRef.current += 1;
      setToast({ ...options, key: keyRef.current });

      const announcement = [options.title, options.message].filter(Boolean).join(". ");
      if (announcement) {
        AccessibilityInfo.announceForAccessibility(announcement);
      }

      const durationMs =
        options.durationMs ?? (options.tone === "love" ? LOVE_DURATION_MS : DEFAULT_DURATION_MS);
      dismissTimerRef.current = setTimeout(hide, durationMs);
    },
    [clearDismissTimer, hide],
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    badgeScale.setValue(0.4);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        mass: 0.8,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(badgeScale, {
        toValue: 1,
        damping: 7,
        stiffness: 200,
        delay: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [badgeScale, opacity, toast, translateY]);

  useEffect(() => clearDismissTimer, [clearDismissTimer]);

  const contextValue = useMemo(() => ({ show, hide }), [hide, show]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast ? (
        <ToastCard
          badgeScale={badgeScale}
          key={toast.key}
          onDismiss={hide}
          opacity={opacity}
          toast={toast}
          topInset={insets.top}
          translateY={translateY}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    left: 0,
    paddingHorizontal: layout.gutter - 8,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  toast: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.raised,
  },
  toastLove: {
    backgroundColor: colors.ink,
    borderColor: "transparent",
    experimental_backgroundImage: gradients.hero,
  },
  toastPressed: {
    opacity: 0.94,
  },
  badge: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  action: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  actionLove: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
});

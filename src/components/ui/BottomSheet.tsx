import { type PropsWithChildren, type ReactNode, useEffect, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { colors, layout, motion, radii, shadows, spacing } from "@/theme/tokens";

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
}>;

export function BottomSheet({
  visible,
  onClose,
  title,
  headerAction,
  footer,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [isClosing, setIsClosing] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));

  if (visible !== wasVisible) {
    setWasVisible(visible);
    setIsClosing(!visible);
  }

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? motion.normal : motion.fast,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(() => {
      if (!visible) {
        setIsClosing(false);
      }
    });

    return () => animation.stop();
  }, [progress, visible]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [windowHeight * 0.4, 0] });

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      // Derived from `visible` so a late animation callback can never hide an open sheet:
      // React drops state set during render when an async update to the same state is pending.
      visible={visible || isClosing}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              maxHeight: windowHeight * 0.88,
              paddingBottom: insets.bottom + spacing.lg,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.grabber} />
          {title || headerAction ? (
            <View style={styles.header}>
              <AppText accessibilityRole="header" style={styles.title} variant="headline">
                {title}
              </AppText>
              {headerAction}
              <IconButton
                accessibilityLabel="Close"
                icon="close"
                onPress={onClose}
                size={36}
                variant="surface"
              />
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.sm,
    ...shadows.raised,
  },
  grabber: {
    alignSelf: "center",
    backgroundColor: colors.borderStrong,
    borderRadius: radii.pill,
    height: 5,
    marginBottom: spacing.sm,
    width: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    flex: 1,
  },
  body: {
    flexShrink: 1,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
});

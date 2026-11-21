import { type PropsWithChildren, type ReactElement, type ReactNode, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useKeyboardOverlap } from "@/components/ui/useKeyboardOverlap";
import { colors, layout, spacing } from "@/theme/tokens";

export type ScreenEdge = "top" | "bottom";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  headerTitle?: string;
  onBack?: () => void;
  backLabel?: string;
  headerRight?: ReactNode;
  edges?: ScreenEdge[];
  centered?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>;

const DEFAULT_EDGES: ScreenEdge[] = ["top", "bottom"];

export function Screen({
  children,
  scroll = false,
  title,
  subtitle,
  eyebrow,
  headerTitle,
  onBack,
  backLabel,
  headerRight,
  edges = DEFAULT_EDGES,
  centered = false,
  refreshControl,
  footer,
  style,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const containerRef = useRef<View>(null);
  const [scrollY] = useState(() => new Animated.Value(0));
  const keyboardOverlap = useKeyboardOverlap(containerRef);

  const hasTopBar = Boolean(onBack || headerRight || headerTitle);
  const padTop = edges.includes("top");
  const padBottom = edges.includes("bottom");
  const compactTitle = headerTitle ?? title;

  const contentPadding = {
    paddingBottom: (padBottom && !footer ? insets.bottom : 0) + spacing["2xl"],
    paddingTop: hasTopBar ? spacing.xs : (padTop ? insets.top : 0) + spacing.lg,
  };

  const titleOpacity =
    title && !headerTitle
      ? scrollY.interpolate({ inputRange: [28, 64], outputRange: [0, 1], extrapolate: "clamp" })
      : 1;
  const dividerOpacity = scrollY.interpolate({
    inputRange: [0, 16],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const titleBlock = title ? (
    <View style={styles.titleBlock}>
      {eyebrow ? (
        <AppText color="primary" variant="overline">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText accessibilityRole="header" variant="title">
        {title}
      </AppText>
      {subtitle ? (
        <AppText color="textSecondary" variant="bodyMuted">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  ) : null;

  return (
    <View
      ref={containerRef}
      style={[styles.root, { paddingBottom: keyboardOverlap }, style]}
      testID={testID}
    >
      {hasTopBar ? (
        <View style={{ paddingTop: padTop ? insets.top : 0 }}>
          <ScreenHeader
            backLabel={backLabel}
            dividerOpacity={scroll ? dividerOpacity : 0}
            onBack={onBack}
            right={headerRight}
            title={compactTitle}
            titleOpacity={scroll ? titleOpacity : title ? 0 : 1}
          />
        </View>
      ) : null}

      {scroll ? (
        <Animated.ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.content,
            contentPadding,
            centered ? styles.centered : null,
            contentContainerStyle,
          ]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          onScroll={
            hasTopBar
              ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                  useNativeDriver: true,
                })
              : undefined
          }
          refreshControl={refreshControl}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {titleBlock}
          {children}
        </Animated.ScrollView>
      ) : (
        <View
          style={[
            styles.content,
            styles.fill,
            contentPadding,
            centered ? styles.centered : null,
            contentContainerStyle,
          ]}
        >
          {titleBlock}
          {children}
        </View>
      )}

      {footer ? (
        <View style={[styles.footer, { paddingBottom: (padBottom ? insets.bottom : 0) + spacing.md }]}>
          {footer}
        </View>
      ) : null}

      {!hasTopBar && padTop ? (
        <View pointerEvents="none" style={[styles.statusBarScrim, { height: insets.top }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: layout.gutter,
  },
  fill: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
  },
  titleBlock: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  statusBarScrim: {
    backgroundColor: colors.background,
    left: 0,
    opacity: 0.96,
    position: "absolute",
    right: 0,
    top: 0,
  },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
  },
});

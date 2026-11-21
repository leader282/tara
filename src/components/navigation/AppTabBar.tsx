import { type ComponentProps, useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import type { Tabs } from "expo-router";

import { AppText } from "@/components/ui/AppText";
import { colors, radii, spacing } from "@/theme/tokens";

export type AppTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
type TabBarIcon = NonNullable<AppTabBarProps["descriptors"][string]["options"]["tabBarIcon"]>;

type TabBarItemProps = {
  label: string;
  focused: boolean;
  renderIcon?: TabBarIcon;
  accessibilityLabel?: string;
  testID?: string;
  onPress: () => void;
  onLongPress: () => void;
};

function TabBarItem({
  label,
  focused,
  renderIcon,
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
}: TabBarItemProps) {
  const [progress] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      damping: 18,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  const tint = focused ? colors.primaryStrong : colors.textTertiary;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.item}
      testID={testID}
    >
      <View style={styles.iconSlot}>
        <Animated.View
          style={[
            styles.indicator,
            {
              opacity: progress,
              transform: [{ scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        />
        {renderIcon?.({ focused, color: tint, size: 22 })}
      </View>
      <AppText
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        style={[styles.label, { color: tint }]}
        variant={focused ? "label" : "caption"}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function AppTabBar({ state, descriptors, navigation, insets }: AppTabBarProps) {
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label =
          typeof options.tabBarLabel === "string" ? options.tabBarLabel : (options.title ?? route.name);

        return (
          <TabBarItem
            accessibilityLabel={options.tabBarAccessibilityLabel}
            focused={isFocused}
            key={route.key}
            label={label}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            renderIcon={options.tabBarIcon}
            testID={options.tabBarButtonTestID}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    boxShadow: "0px -6px 24px rgba(51, 30, 22, 0.05)",
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minHeight: 52,
  },
  iconSlot: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 60,
  },
  indicator: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
  },
});

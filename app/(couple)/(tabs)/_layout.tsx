import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";

import { AppTabBar } from "@/components/navigation/AppTabBar";
import { Icon, type IconName } from "@/components/ui";
import { colors } from "@/theme/tokens";

function tabIcon(activeIcon: IconName, inactiveIcon: IconName) {
  return function TabIcon({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: ColorValue;
    size: number;
  }) {
    return <Icon name={focused ? activeIcon : inactiveIcon} size={size} tintColor={color} />;
  };
}

export default function CoupleTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarButtonTestID: "tab-home",
          tabBarIcon: tabIcon("home", "home-outline"),
        }}
      />
      <Tabs.Screen
        name="rituals"
        options={{
          title: "Rituals",
          tabBarButtonTestID: "tab-rituals",
          tabBarIcon: tabIcon("sparkles", "sparkles-outline"),
        }}
      />
      <Tabs.Screen
        name="capsules"
        options={{
          title: "Capsules",
          tabBarButtonTestID: "tab-capsules",
          tabBarIcon: tabIcon("gift", "gift-outline"),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          tabBarButtonTestID: "tab-timeline",
          tabBarIcon: tabIcon("albums", "albums-outline"),
        }}
      />
    </Tabs>
  );
}

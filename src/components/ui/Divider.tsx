import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/theme/tokens";

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
  },
});

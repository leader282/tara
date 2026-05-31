import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

type RitualStatusBadgeProps = {
  status: string;
};

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "scheduled":
      return "Scheduled";
    case "skipped":
      return "Skipped";
    default:
      return "In progress";
  }
}

function getStatusStyles(status: string) {
  if (status === "completed") {
    return {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.success,
      textColor: "success" as const,
    };
  }

  if (status === "skipped") {
    return {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.danger,
      textColor: "danger" as const,
    };
  }

  return {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    textColor: "textSecondary" as const,
  };
}

export function RitualStatusBadge({ status }: RitualStatusBadgeProps) {
  const statusStyles = getStatusStyles(status);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusStyles.backgroundColor,
          borderColor: statusStyles.borderColor,
        },
      ]}
    >
      <AppText color={statusStyles.textColor} variant="caption">
        {getStatusLabel(status)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import type { CapsuleStatus } from "@/features/capsules/types";
import { colors, radii, spacing } from "@/theme/tokens";

type CapsuleStatusBadgeProps = {
  status: CapsuleStatus;
};

function getStatusLabel(status: CapsuleStatus): string {
  switch (status) {
    case "openable":
      return "Ready to open";
    case "opened":
      return "Opened";
    case "created_by_me":
      return "Yours";
    case "unavailable":
      return "Unavailable";
    case "locked":
    default:
      return "Locked";
  }
}

function getStatusStyles(status: CapsuleStatus) {
  if (status === "opened") {
    return {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.success,
      textColor: "success" as const,
    };
  }

  if (status === "openable") {
    return {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.primary,
      textColor: "primary" as const,
    };
  }

  if (status === "created_by_me") {
    return {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      textColor: "textPrimary" as const,
    };
  }

  if (status === "unavailable") {
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

export function CapsuleStatusBadge({ status }: CapsuleStatusBadgeProps) {
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

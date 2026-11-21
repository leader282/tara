import { Badge, type BadgeTone, type IconName } from "@/components/ui";
import type { CapsuleStatus } from "@/features/capsules/types";

type CapsuleStatusBadgeProps = {
  status: CapsuleStatus;
};

export function getCapsuleStatusPresentation(status: CapsuleStatus): {
  label: string;
  tone: BadgeTone;
  icon: IconName;
} {
  switch (status) {
    case "openable":
      return { label: "Ready to open", tone: "primary", icon: "gift" };
    case "opened":
      return { label: "Opened", tone: "success", icon: "mail-open-outline" };
    case "created_by_me":
      return { label: "Yours", tone: "info", icon: "lock-closed" };
    case "unavailable":
      return { label: "Unavailable", tone: "danger", icon: "alert-circle" };
    case "locked":
    default:
      return { label: "Locked", tone: "neutral", icon: "lock-closed" };
  }
}

export function CapsuleStatusBadge({ status }: CapsuleStatusBadgeProps) {
  const presentation = getCapsuleStatusPresentation(status);

  return <Badge icon={presentation.icon} label={presentation.label} tone={presentation.tone} />;
}

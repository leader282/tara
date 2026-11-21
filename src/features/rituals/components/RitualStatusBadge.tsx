import { Badge, type BadgeTone, type IconName } from "@/components/ui";

type RitualStatusBadgeProps = {
  status: string;
};

function getStatusPresentation(status: string): { label: string; tone: BadgeTone; icon: IconName } {
  switch (status) {
    case "completed":
      return { label: "Revealed", tone: "success", icon: "checkmark-circle" };
    case "scheduled":
      return { label: "Not revealed", tone: "neutral", icon: "time-outline" };
    case "skipped":
      return { label: "Skipped", tone: "danger", icon: "close-circle" };
    default:
      return { label: "In progress", tone: "primary", icon: "ellipse" };
  }
}

export function RitualStatusBadge({ status }: RitualStatusBadgeProps) {
  const presentation = getStatusPresentation(status);

  return <Badge icon={presentation.icon} label={presentation.label} tone={presentation.tone} />;
}

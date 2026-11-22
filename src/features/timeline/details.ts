import type { IconName } from "@/components/ui";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";
import { normalizeRitualCategory, RITUAL_CATEGORY_LABELS } from "@/features/rituals/constants";
import type { TimelineDisplayItem } from "@/features/timeline/types";
import { formatDateOnly, formatMeetupDateTime, formatTimelineDateTime } from "@/lib/dates/format";

export type TimelineDetailLine = {
  icon: IconName;
  label: string;
};

function getPulseLabel(pulseType: string | undefined): string {
  if (pulseType && pulseType in PRESENCE_PULSE_OPTIONS) {
    return PRESENCE_PULSE_OPTIONS[pulseType as keyof typeof PRESENCE_PULSE_OPTIONS].label;
  }

  return "A gentle pulse";
}

// Pulses are the one moment that goes from one partner to the other, so say who sent it.
export function getTimelineTitle(item: TimelineDisplayItem, actorName: string | null): string {
  return item.type === "presence_sent" && actorName ? `${actorName} sent a pulse` : item.title;
}

// The card's own time already says when it happened, so these lines never repeat it.
export function getTimelineDetailLines(item: TimelineDisplayItem): TimelineDetailLine[] {
  const { payload } = item;

  switch (payload.type) {
    case "presence_sent": {
      const lines: TimelineDetailLine[] = [
        { icon: "heart-outline", label: getPulseLabel(payload.value.pulse_type) },
      ];
      if (payload.value.has_optional_message && !item.message) {
        lines.push({ icon: "chatbubble-outline", label: "Included a short note." });
      }
      return lines;
    }
    case "ritual_completed": {
      const { category, scheduled_for: scheduledFor } = payload.value;
      const lines: TimelineDetailLine[] = [];
      if (category) {
        lines.push({ icon: "sparkles-outline", label: RITUAL_CATEGORY_LABELS[normalizeRitualCategory(category)] });
      }
      // Only mention the ritual's day if it was answered on a later one.
      const scheduledLabel =
        scheduledFor && scheduledFor !== item.createdAt.slice(0, 10) ? formatDateOnly(scheduledFor) : null;
      if (scheduledLabel) {
        lines.push({ icon: "calendar-outline", label: `For ${scheduledLabel}` });
      }
      return lines;
    }
    case "capsule_created": {
      const unlockLabel = formatTimelineDateTime(payload.value.unlock_at);
      const lines: TimelineDetailLine[] = [
        { icon: "lock-closed-outline", label: unlockLabel ? `Unlocks ${unlockLabel}.` : "Saved to open later." },
      ];
      if (payload.value.has_note) {
        lines.push({ icon: "document-text-outline", label: "Includes a private note." });
      }
      if (payload.value.has_media) {
        lines.push({ icon: "image-outline", label: "Includes photos or videos." });
      }
      return lines;
    }
    case "capsule_opened": {
      const unlockLabel = formatTimelineDateTime(payload.value.unlock_at);
      return unlockLabel ? [{ icon: "time-outline", label: `Was set to open ${unlockLabel}.` }] : [];
    }
    case "countdown_updated": {
      const meetupLabel = formatMeetupDateTime(payload.value.next_meetup_at ?? null);
      const lines: TimelineDetailLine[] = [
        { icon: "calendar-outline", label: meetupLabel ? `Next meetup: ${meetupLabel}.` : "The meetup was cleared." },
      ];
      if (payload.value.has_location || payload.value.next_meetup_location?.trim()) {
        lines.push({ icon: "location-outline", label: "Includes a place." });
      }
      return lines;
    }
    default:
      return [{ icon: "shield-checkmark-outline", label: "This shared moment is saved safely." }];
  }
}

// Read-only cards are read out as one item, so the label carries everything they show.
export function getTimelineAccessibilityLabel(
  item: TimelineDisplayItem,
  title: string,
  lines: TimelineDetailLine[]
): string {
  return [`${item.typeLabel}: ${title}`, ...lines.map((line) => line.label), item.message, item.createdAtLabel]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.replace(/\.$/, ""))
    .join(". ");
}

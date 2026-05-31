import { Card, EmptyState } from "@/components/ui";

export function TimelineEmptyState() {
  return (
    <Card>
      <EmptyState
        description="Pulses, rituals, capsules, and reunions will appear as you use Tara."
        title="Your shared moments will gather here."
      />
    </Card>
  );
}

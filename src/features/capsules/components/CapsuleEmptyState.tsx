import { Card, EmptyState } from "@/components/ui";

type CapsuleEmptyStateProps = {
  onCreatePress: () => void;
};

export function CapsuleEmptyState({ onCreatePress }: CapsuleEmptyStateProps) {
  return (
    <Card>
      <EmptyState
        actionLabel="Create your first capsule"
        description="Save a note now and open it together on a future day."
        onActionPress={onCreatePress}
        title="No memory capsules yet"
      />
    </Card>
  );
}

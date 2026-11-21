import { Card, EmptyState } from "@/components/ui";

type CapsuleEmptyStateProps = {
  onCreatePress: () => void;
};

export function CapsuleEmptyState({ onCreatePress }: CapsuleEmptyStateProps) {
  return (
    <Card>
      <EmptyState
        actionLabel="Create your first capsule"
        description="Add a note, photos, or a short video. Your partner sees it's waiting, but not what's inside, until it opens."
        emoji="🎁"
        onActionPress={onCreatePress}
        title="No memory capsules yet"
      />
    </Card>
  );
}

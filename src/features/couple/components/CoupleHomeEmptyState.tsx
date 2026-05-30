import { EmptyState, Card } from "@/components/ui";

type CoupleHomeEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function CoupleHomeEmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
}: CoupleHomeEmptyStateProps) {
  return (
    <Card>
      <EmptyState
        actionLabel={actionLabel}
        description={description}
        onActionPress={onActionPress}
        title={title}
      />
    </Card>
  );
}

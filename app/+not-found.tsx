import { useRouter } from "expo-router";

import { EmptyState, Screen } from "@/components/ui";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen centered>
      <EmptyState
        actionLabel="Back to home"
        description="This screen does not exist in Tara yet."
        icon="compass-outline"
        onActionPress={() => router.replace("/")}
        title="Page not found"
      />
    </Screen>
  );
}

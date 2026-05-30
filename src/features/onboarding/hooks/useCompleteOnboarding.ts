import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateOnboardingCompleted } from "@/features/profile/api/profileApi";
import { ensureNotificationPreferences } from "@/features/profile/api/userSettingsApi";
import { queryKeys } from "@/lib/query/queryKeys";

export function useCompleteOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("You must be signed in to complete onboarding.");
      }

      const notificationPreferences = await ensureNotificationPreferences(user.id);
      const profile = await updateOnboardingCompleted(user.id, true);

      return { notificationPreferences, profile };
    },
    onSuccess: ({ notificationPreferences, profile }) => {
      queryClient.setQueryData(queryKeys.profile.current(profile.id), profile);
      queryClient.setQueryData(
        queryKeys.profile.notificationPreferences(notificationPreferences.user_id),
        notificationPreferences
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile.current(profile.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile.notificationPreferences(notificationPreferences.user_id),
      });
    },
  });
}

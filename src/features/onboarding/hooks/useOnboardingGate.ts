import { useMemo } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCurrentProfile } from "@/features/profile/hooks/useCurrentProfile";
import type { Profile } from "@/features/profile/types";

export type OnboardingGateResult = {
  isLoading: boolean;
  needsOnboarding: boolean;
  profile: Profile | null;
  error: Error | null;
};

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load onboarding gate state.");
}

export function useOnboardingGate(): OnboardingGateResult {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const profileQuery = useCurrentProfile(user?.id);

  return useMemo(() => {
    const profile = profileQuery.data ?? null;
    const error = toError(profileQuery.error);
    const isLoading = isInitializing || (isAuthenticated && profileQuery.isLoading);
    const needsOnboarding =
      isAuthenticated && !isLoading && !error && !profile?.onboarding_completed;

    return {
      isLoading,
      needsOnboarding,
      profile,
      error,
    };
  }, [
    isAuthenticated,
    isInitializing,
    profileQuery.data,
    profileQuery.error,
    profileQuery.isLoading,
  ]);
}

import { type PropsWithChildren, createContext, useCallback, useEffect, useMemo, useState } from "react";

import {
  getCurrentSession,
  signInWithPassword,
  signOut as signOutFromApi,
  signUpWithPassword,
  type AuthResponse,
  type SignUpResponse,
} from "@/features/auth/api/authApi";
import type {
  AuthSession,
  AuthStatus,
  AuthUser,
  SignInInput,
  SignUpInput,
} from "@/features/auth/types";
import { queryClient } from "@/lib/query/queryClient";
import { supabase } from "@/lib/supabase/client";

export type AuthContextValue = {
  session: AuthSession;
  user: AuthUser;
  authStatus: AuthStatus;
  isInitializing: boolean;
  isAuthenticated: boolean;
  signIn: (input: SignInInput) => Promise<AuthResponse>;
  signUp: (input: SignUpInput) => Promise<SignUpResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const applySession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthResponse> => {
    const authResponse = await getCurrentSession();
    applySession(authResponse.session);
    return authResponse;
  }, [applySession]);

  const signIn = useCallback(
    async (input: SignInInput): Promise<AuthResponse> => {
      const authResponse = await signInWithPassword(input);
      applySession(authResponse.session);
      return authResponse;
    },
    [applySession]
  );

  const signUp = useCallback(
    async (input: SignUpInput): Promise<SignUpResponse> => {
      const authResponse = await signUpWithPassword(input);
      applySession(authResponse.session);
      return authResponse;
    },
    [applySession]
  );

  const signOut = useCallback(async () => {
    await signOutFromApi();
    queryClient.clear();
    applySession(null);
  }, [applySession]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const authResponse = await getCurrentSession();
        if (!isMounted) {
          return;
        }

        applySession(authResponse.session);
      } catch {
        if (isMounted) {
          applySession(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) {
        return;
      }

      if (event === "SIGNED_OUT") {
        queryClient.clear();
      }

      applySession(nextSession);
      setIsInitializing(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const isAuthenticated = Boolean(session?.user);
  const authStatus: AuthStatus = isInitializing
    ? "initializing"
    : isAuthenticated
      ? "authenticated"
      : "unauthenticated";

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      authStatus,
      isInitializing,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [
      session,
      user,
      authStatus,
      isInitializing,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

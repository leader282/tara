import type { AuthError } from "@supabase/supabase-js";

import type {
  AuthSession,
  AuthUser,
  SignInInput,
  SignUpInput,
} from "@/features/auth/types";
import { AuthActionError, getAuthErrorMessage } from "@/lib/errors/authErrorMessages";
import { supabase } from "@/lib/supabase/client";

export type AuthResponse = {
  session: AuthSession;
  user: AuthUser;
};

export type SignUpResponse = AuthResponse & {
  requiresEmailConfirmation: boolean;
};

function assertNoAuthError(error: AuthError | null): void {
  if (error) {
    throw new AuthActionError(getAuthErrorMessage(error));
  }
}

function toAuthResponse(session: AuthSession, user: AuthUser): AuthResponse {
  return {
    session,
    user: user ?? session?.user ?? null,
  };
}

export async function signInWithPassword({
  email,
  password,
}: SignInInput): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  assertNoAuthError(error);

  return toAuthResponse(data.session, data.user);
}

export async function signUpWithPassword({
  email,
  password,
}: SignUpInput): Promise<SignUpResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  assertNoAuthError(error);

  const authResponse = toAuthResponse(data.session, data.user);

  return {
    ...authResponse,
    requiresEmailConfirmation: data.session === null,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  assertNoAuthError(error);
}

export async function getCurrentSession(): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.getSession();
  assertNoAuthError(error);

  return toAuthResponse(data.session, data.session?.user ?? null);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data, error } = await supabase.auth.getUser();
  assertNoAuthError(error);

  return data.user;
}

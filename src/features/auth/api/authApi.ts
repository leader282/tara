import type { AuthError, EmailOtpType } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

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

const authCallbackPath = "auth/callback";
const emailOtpTypes = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

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

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && emailOtpTypes.has(value);
}

function getAuthCallbackParams(url: string): URLSearchParams {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hash = parsedUrl.hash.startsWith("#")
    ? parsedUrl.hash.slice(1)
    : parsedUrl.hash;
  const hashParams = new URLSearchParams(hash);

  hashParams.forEach((value, key) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  return params;
}

export function getAuthEmailRedirectTo(): string {
  return Linking.createURL(authCallbackPath);
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
    options: {
      emailRedirectTo: getAuthEmailRedirectTo(),
    },
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

export async function completeAuthRedirect(url: string): Promise<AuthResponse> {
  const params = getAuthCallbackParams(url);
  const errorDescription = params.get("error_description");

  if (errorDescription) {
    throw new AuthActionError(errorDescription);
  }

  const code = params.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    assertNoAuthError(error);
    return toAuthResponse(data.session, data.session?.user ?? null);
  }

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash && isEmailOtpType(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    assertNoAuthError(error);
    return toAuthResponse(data.session, data.user);
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    assertNoAuthError(error);
    return toAuthResponse(data.session, data.user);
  }

  throw new AuthActionError("Confirmation link is missing auth details.");
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

import type { AuthError } from "@supabase/supabase-js";

export const defaultAuthErrorMessage =
  "We could not complete that right now. Please try again.";

export class AuthActionError extends Error {
  constructor(message: string = defaultAuthErrorMessage) {
    super(message);
    this.name = "AuthActionError";
  }
}

export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) {
    return defaultAuthErrorMessage;
  }

  const normalizedMessage = error.message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Email or password is incorrect. Please try again.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Please confirm your email, then try signing in again.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "An account with this email may already exist. Try signing in instead.";
  }

  if (normalizedMessage.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }

  if (normalizedMessage.includes("signup is disabled")) {
    return "Sign up is currently unavailable. Please try again shortly.";
  }

  return defaultAuthErrorMessage;
}

export function toAuthActionMessage(error: unknown): string {
  if (error instanceof AuthActionError) {
    return error.message;
  }

  return defaultAuthErrorMessage;
}

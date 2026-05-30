import type { Session, User } from "@supabase/supabase-js";

import type {
  SignInInput as SignInSchemaInput,
  SignUpInput as SignUpSchemaInput,
} from "@/features/auth/schemas";

export type AuthUser = User | null;
export type AuthSession = Session | null;

export type SignInInput = SignInSchemaInput;
export type SignUpInput = SignUpSchemaInput;

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

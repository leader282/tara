import { z } from "zod";

import { AppError } from "@/lib/errors/AppError";

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .url("EXPO_PUBLIC_SUPABASE_URL must be a valid URL."),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required."),
});

const parsedEnv = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new AppError(
    "ENV_INVALID",
    `Missing or invalid Expo public env vars. Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file. Details: ${details}`
  );
}

export const env = parsedEnv.data;

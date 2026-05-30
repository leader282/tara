import { z } from "zod";

import { upsertCurrentProfileSchema } from "@/features/profile/schemas";
import type { Profile, UpsertCurrentProfileInput } from "@/features/profile/types";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

const userIdSchema = z.string().uuid("A valid user id is required.");

function normalizeOptionalText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function throwIfSupabaseError(errorMessage: string | null | undefined): void {
  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const parsedUserId = userIdSchema.parse(userId);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", parsedUserId)
    .maybeSingle();

  throwIfSupabaseError(error?.message);

  return data;
}

export async function upsertCurrentProfile(input: UpsertCurrentProfileInput): Promise<Profile> {
  const parsedInput = upsertCurrentProfileSchema.parse(input);

  const payload: TablesInsert<"profiles"> = {
    id: parsedInput.userId,
    display_name: parsedInput.displayName.trim(),
    timezone: parsedInput.timezone.trim(),
    city: normalizeOptionalText(parsedInput.city),
    country: normalizeOptionalText(parsedInput.country),
    birthday: normalizeOptionalText(parsedInput.birthday),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  throwIfSupabaseError(error?.message);

  if (!data) {
    throw new Error("Profile upsert returned no data.");
  }

  return data;
}

export async function updateOnboardingCompleted(
  userId: string,
  completed: boolean
): Promise<Profile> {
  const parsedUserId = userIdSchema.parse(userId);

  const { data, error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: completed })
    .eq("id", parsedUserId)
    .select("*")
    .maybeSingle();

  throwIfSupabaseError(error?.message);

  if (!data) {
    throw new Error("Profile row is required before onboarding can be completed.");
  }

  return data;
}

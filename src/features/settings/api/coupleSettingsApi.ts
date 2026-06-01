import type { PostgrestError } from "@supabase/supabase-js";

import { SETTINGS_RITUAL_FREQUENCIES } from "@/features/settings/constants";
import {
  settingsCoupleIdSchema,
  updateCoupleSharedSettingsSchema,
} from "@/features/settings/schemas";
import type {
  CoupleSettingsSummary,
  SettingsRitualFrequency,
  UpdateCoupleSharedSettingsInput,
} from "@/features/settings/types";
import { toSettingsActionError } from "@/lib/errors/settingsErrorMessages";
import { supabase } from "@/lib/supabase/client";

function throwIfSupabaseError(error: PostgrestError | null): void {
  if (error) {
    throw error;
  }
}

function normalizeRitualFrequency(value: string | null | undefined): SettingsRitualFrequency {
  if (!value) {
    return SETTINGS_RITUAL_FREQUENCIES[0];
  }

  if (SETTINGS_RITUAL_FREQUENCIES.includes(value as SettingsRitualFrequency)) {
    return value as SettingsRitualFrequency;
  }

  return SETTINGS_RITUAL_FREQUENCIES[0];
}

export async function getCoupleSettings(coupleId: string): Promise<CoupleSettingsSummary | null> {
  try {
    const parsedCoupleId = settingsCoupleIdSchema.parse(coupleId);

    const [coupleResult, coupleSettingsResult] = await Promise.all([
      supabase
        .from("couples")
        .select("id,anniversary_date,updated_at")
        .eq("id", parsedCoupleId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("couple_settings")
        .select("couple_id,ritual_frequency,theme,privacy_level,updated_at")
        .eq("couple_id", parsedCoupleId)
        .maybeSingle(),
    ]);

    throwIfSupabaseError(coupleResult.error);
    throwIfSupabaseError(coupleSettingsResult.error);

    if (!coupleResult.data) {
      return null;
    }

    return {
      coupleId: coupleResult.data.id,
      anniversaryDate: coupleResult.data.anniversary_date ?? null,
      ritualFrequency: normalizeRitualFrequency(coupleSettingsResult.data?.ritual_frequency),
      theme: coupleSettingsResult.data?.theme ?? null,
      privacyLevel: coupleSettingsResult.data?.privacy_level ?? "private",
      coupleUpdatedAt: coupleResult.data.updated_at ?? null,
      coupleSettingsUpdatedAt: coupleSettingsResult.data?.updated_at ?? null,
    };
  } catch (error) {
    throw toSettingsActionError(error);
  }
}

export async function updateCoupleSharedSettings(
  input: UpdateCoupleSharedSettingsInput,
): Promise<CoupleSettingsSummary> {
  try {
    const parsedInput = updateCoupleSharedSettingsSchema.parse(input);

    const { data, error } = await supabase.rpc("update_couple_shared_settings", {
      p_anniversary_date: parsedInput.anniversaryDate ?? undefined,
      p_ritual_frequency: parsedInput.ritualFrequency ?? undefined,
      p_theme: parsedInput.theme ?? undefined,
    });

    throwIfSupabaseError(error);

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      throw new Error("Couple settings update returned no data.");
    }

    return {
      coupleId: result.couple_id,
      anniversaryDate: result.anniversary_date ?? null,
      ritualFrequency: normalizeRitualFrequency(result.ritual_frequency),
      theme: result.theme ?? null,
      privacyLevel: "private",
      coupleUpdatedAt: result.couple_updated_at ?? null,
      coupleSettingsUpdatedAt: result.couple_settings_updated_at ?? null,
    };
  } catch (error) {
    throw toSettingsActionError(error);
  }
}

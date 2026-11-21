import { attachedMediaRowsSchema } from "@/features/media/schemas";
import type { AttachedMedia } from "@/features/media/types";
import { supabase } from "@/lib/supabase/client";

// Only rows the viewer may see come back: a partner's answer media stays hidden until the
// reveal, and capsule media until the capsule is opened.
const ATTACHED_MEDIA_SELECT = `
  id,
  storage_path,
  media_type,
  width,
  height,
  duration_ms,
  sort_order,
  ritual_completion_id,
  memory_capsule_id
`;

export async function getRitualCompletionMedia(ritualCompletionIds: string[]): Promise<AttachedMedia[]> {
  if (ritualCompletionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("media_assets")
    .select(ATTACHED_MEDIA_SELECT)
    .in("ritual_completion_id", ritualCompletionIds)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return attachedMediaRowsSchema.parse(data ?? []);
}

export async function getCapsuleMedia(capsuleId: string): Promise<AttachedMedia[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select(ATTACHED_MEDIA_SELECT)
    .eq("memory_capsule_id", capsuleId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return attachedMediaRowsSchema.parse(data ?? []);
}

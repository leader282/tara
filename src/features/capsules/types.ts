import type {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import { z } from "zod";

import type {
  CAPSULE_DETAIL_STATUSES,
  CAPSULE_STATUSES,
} from "@/features/capsules/constants";
import { createCapsuleSchema, openCapsuleSchema } from "@/features/capsules/schemas";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type MemoryCapsule = Tables<"memory_capsules">;
export type MemoryCapsuleContent = Tables<"memory_capsule_contents">;

export type CapsuleStatus = (typeof CAPSULE_STATUSES)[number];
export type CapsuleDetailStatus = (typeof CAPSULE_DETAIL_STATUSES)[number];
export type CapsuleUnlockState = "locked" | "ready_to_open" | "opened";

export type CapsuleListItem = {
  capsule: MemoryCapsule;
  status: CapsuleStatus;
  unlockState: CapsuleUnlockState;
  isCreatedByMe: boolean;
  isOpened: boolean;
  canOpen: boolean;
};

export type CapsuleDetail = {
  capsule: MemoryCapsule;
  content: MemoryCapsuleContent | null;
  status: Exclude<CapsuleDetailStatus, "error">;
  unlockState: CapsuleUnlockState;
  isCreatedByMe: boolean;
  canReadContent: boolean;
};

export type CreateCapsuleInput = z.infer<typeof createCapsuleSchema>;
export type OpenCapsuleInput = z.infer<typeof openCapsuleSchema>;

export type CreateMemoryCapsuleRpcResult =
  Database["public"]["Functions"]["create_memory_capsule"]["Returns"][number];
export type OpenMemoryCapsuleRpcResult =
  Database["public"]["Functions"]["open_memory_capsule"]["Returns"][number];

export type CapsuleRealtimeEvent =
  | RealtimePostgresInsertPayload<Tables<"memory_capsules">>
  | RealtimePostgresUpdatePayload<Tables<"memory_capsules">>;

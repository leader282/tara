import * as Linking from "expo-linking";

import { normalizeInviteCode } from "@/features/invite/api/inviteApi";

export function buildInviteLink(inviteCode: string): string | null {
  const normalizedCode = normalizeInviteCode(inviteCode);
  if (!normalizedCode) {
    return null;
  }

  try {
    return Linking.createURL(`/${encodeURIComponent(normalizedCode)}`);
  } catch {
    return null;
  }
}

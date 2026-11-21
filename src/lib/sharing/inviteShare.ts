import { normalizeInviteCode } from "@/features/invite/api/inviteApi";

// Messaging apps only make http(s) links tappable, so invites link to a web page that hands the
// code to the app (web/invite). The code goes after "#" so neither that page's server nor
// link-preview crawlers ever receive it.
const INVITE_PAGE_URL = "https://tara-invite.vercel.app/join";

export function buildInviteLink(inviteCode: string): string | null {
  const normalizedCode = normalizeInviteCode(inviteCode);
  if (!normalizedCode) {
    return null;
  }

  return `${INVITE_PAGE_URL}#${encodeURIComponent(normalizedCode)}`;
}

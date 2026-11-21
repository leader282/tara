import { describe, expect, it, jest } from "@jest/globals";

jest.mock("@/lib/supabase/client", () => ({ supabase: {} }));

import { buildInviteMessage } from "@/features/invite/api/inviteApi";
import { buildInviteLink } from "@/lib/sharing/inviteShare";

describe("invite links", () => {
  it("links to the https invite page, which messaging apps make tappable", () => {
    expect(buildInviteLink(" ABC_def-123 ")).toBe("https://tara-invite.vercel.app/join#ABC_def-123");
  });

  it("keeps the code out of the path and query so the page's server never receives it", () => {
    const link = new URL(buildInviteLink("ABC_def-123") ?? "");

    expect(link.pathname).toBe("/join");
    expect(link.search).toBe("");
    expect(link.hash).toBe("#ABC_def-123");
  });

  it("returns no link for an empty code", () => {
    expect(buildInviteLink("   ")).toBeNull();
  });

  it("shares the code alongside the link", () => {
    const message = buildInviteMessage("ABC_def-123", buildInviteLink("ABC_def-123") ?? undefined);

    expect(message).toContain("Invite code: ABC_def-123");
    expect(message).toContain("https://tara-invite.vercel.app/join#ABC_def-123");
  });
});

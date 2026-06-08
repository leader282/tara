import { describe, expect, it } from "@jest/globals";

import { leaveCurrentCoupleConfirmationSchema, requestAccountDeletionInputSchema } from "@/features/account/schemas";
import { createCapsuleSchema } from "@/features/capsules/schemas";
import { acceptInviteSchema } from "@/features/invite/schemas";
import { quietHoursSchema } from "@/features/onboarding/schemas";
import { upsertCurrentProfileSchema } from "@/features/profile/schemas";
import { completeRitualSchema } from "@/features/rituals/schemas";

const USER_ID = "33333333-3333-4333-8333-333333333333";
const RITUAL_ID = "44444444-4444-4444-8444-444444444444";

describe("zod validation schemas", () => {
  it("validates profile input with required fields", () => {
    const parsed = upsertCurrentProfileSchema.parse({
      userId: USER_ID,
      displayName: "Levi",
      timezone: "Asia/Kolkata",
      city: "Bengaluru",
      country: "India",
      birthday: "1997-06-09",
    });

    expect(parsed.userId).toBe(USER_ID);
    expect(parsed.displayName).toBe("Levi");
    expect(parsed.timezone).toBe("Asia/Kolkata");
  });

  it("rejects invalid invite codes and normalizes valid ones", () => {
    const parsed = acceptInviteSchema.parse({
      inviteCode: "ABCD EFGH IJKL MNOP",
    });

    expect(parsed.inviteCode).toBe("ABCDEFGHIJKLMNOP");
    expect(() => acceptInviteSchema.parse({ inviteCode: "short" })).toThrow();
  });

  it("validates ritual response payload length and normalization", () => {
    const parsed = completeRitualSchema.parse({
      coupleRitualId: RITUAL_ID,
      textResponse: "   ",
      mediaAssetId: null,
    });

    expect(parsed.textResponse).toBeNull();
    expect(() =>
      completeRitualSchema.parse({
        coupleRitualId: RITUAL_ID,
        textResponse: "a".repeat(1001),
        mediaAssetId: null,
      }),
    ).toThrow();
  });

  it("requires note or media when creating a capsule", () => {
    const validInput = createCapsuleSchema.parse({
      title: "For your next visit",
      note: "A warm memory for later.",
      mediaAssetId: null,
      unlockDate: "2026-12-01",
      unlockTime: "09:00",
      emotionalContext: "Long-distance encouragement",
    });

    expect(validInput.title).toBe("For your next visit");
    expect(() =>
      createCapsuleSchema.parse({
        title: "Missing content",
        note: "   ",
        mediaAssetId: null,
        unlockDate: "2026-12-01",
        unlockTime: "09:00",
        emotionalContext: "",
      }),
    ).toThrow("Add a note or private photo before saving this memory capsule.");
  });

  it("enforces UNPAIR and DELETE confirmations", () => {
    expect(leaveCurrentCoupleConfirmationSchema.parse("  UNPAIR ")).toBe("UNPAIR");
    expect(() => leaveCurrentCoupleConfirmationSchema.parse("DELETE")).toThrow();

    const parsedDeletion = requestAccountDeletionInputSchema.parse({
      confirmation: "DELETE",
      reason: "  I need a reset  ",
    });
    expect(parsedDeletion.reason).toBe("I need a reset");
    expect(() =>
      requestAccountDeletionInputSchema.parse({
        confirmation: "UNPAIR",
      }),
    ).toThrow();
  });

  it("accepts overnight quiet-hours windows and enforces required times", () => {
    const parsed = quietHoursSchema.parse({
      quietHoursEnabled: true,
      quietHoursStart: "23:00",
      quietHoursEnd: "06:30",
    });

    expect(parsed.quietHoursStart).toBe("23:00");
    expect(parsed.quietHoursEnd).toBe("06:30");

    expect(() =>
      quietHoursSchema.parse({
        quietHoursEnabled: true,
        quietHoursStart: "",
        quietHoursEnd: "06:30",
      }),
    ).toThrow("Start time is required when quiet hours are enabled.");
  });
});

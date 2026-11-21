import { describe, expect, it } from "@jest/globals";

import { toForegroundBanner } from "@/features/notifications/services/foregroundBanner";
import { claimPulseAnnouncement } from "@/features/presence/services/pulseAnnouncements";

const PRESENCE_EVENT_ID = "33333333-3333-4333-8333-333333333333";
const CAPSULE_ID = "22222222-2222-4222-8222-222222222222";

describe("foreground notification banners", () => {
  it("moves the leading emoji into the banner badge", () => {
    const banner = toForegroundBanner({
      title: "🤗 Mona sent you a hug",
      body: "Wrapped up warm and sent across the miles.",
      data: { type: "presence_pulse", presence_event_id: PRESENCE_EVENT_ID },
    });

    expect(banner).toEqual({
      type: "presence_pulse",
      emoji: "🤗",
      title: "Mona sent you a hug",
      message: "Wrapped up warm and sent across the miles.",
      route: "/(couple)",
      presenceEventId: PRESENCE_EVENT_ID,
    });
  });

  it("falls back to the type emoji and keeps deep links", () => {
    const banner = toForegroundBanner({
      title: "A memory capsule is ready",
      body: null,
      data: { type: "capsule_unlocked", capsule_id: CAPSULE_ID },
    });

    expect(banner?.emoji).toBe("🎁");
    expect(banner?.message).toBeNull();
    expect(banner?.route).toBe(`/(couple)/capsules/${CAPSULE_ID}`);
  });

  it("ignores notifications Tara does not recognize", () => {
    expect(toForegroundBanner({ title: "Hello", data: { type: "marketing" } })).toBeNull();
    expect(toForegroundBanner({ title: "", data: { type: "ritual_ready" } })).toBeNull();
    expect(toForegroundBanner({ title: "Hello", data: null })).toBeNull();
  });
});

describe("pulse announcements", () => {
  it("announces each pulse only once", () => {
    const pulseId = "44444444-4444-4444-8444-444444444444";

    expect(claimPulseAnnouncement(pulseId)).toBe(true);
    expect(claimPulseAnnouncement(pulseId)).toBe(false);
  });
});

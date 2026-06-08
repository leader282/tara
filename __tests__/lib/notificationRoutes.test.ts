import { describe, expect, it } from "@jest/globals";

import { resolveNotificationRouteFromData } from "@/features/notifications/services/notificationNavigation";

const CAPSULE_ID = "22222222-2222-4222-8222-222222222222";

describe("notification route mapping", () => {
  it("routes presence notifications to couple home", () => {
    const route = resolveNotificationRouteFromData({
      type: "presence_pulse",
    });

    expect(route).toBe("/(couple)");
  });

  it("routes ritual notifications to rituals screen", () => {
    const route = resolveNotificationRouteFromData({
      type: "ritual_ready",
    });

    expect(route).toBe("/(couple)/rituals");
  });

  it("routes capsule notifications to capsule detail when id is valid", () => {
    const route = resolveNotificationRouteFromData({
      type: "capsule_unlocked",
      capsule_id: CAPSULE_ID,
    });

    expect(route).toBe(`/(couple)/capsules/${CAPSULE_ID}`);
  });

  it("routes capsule notifications to capsule list when id is absent", () => {
    const route = resolveNotificationRouteFromData({
      type: "capsule_unlocked",
    });

    expect(route).toBe("/(couple)/capsules");
  });

  it("ignores malformed payloads safely", () => {
    expect(resolveNotificationRouteFromData({ capsule_id: CAPSULE_ID })).toBeNull();
    expect(resolveNotificationRouteFromData({ type: "unknown_type" })).toBeNull();
    expect(resolveNotificationRouteFromData({ type: "capsule_unlocked", capsule_id: "not-a-uuid" })).toBeNull();
    expect(resolveNotificationRouteFromData({ type: "presence_pulse", extra: "field" })).toBeNull();
  });
});

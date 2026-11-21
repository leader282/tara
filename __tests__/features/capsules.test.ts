import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { CapsuleStatusBadge } from "@/features/capsules/components/CapsuleStatusBadge";
import type { CapsuleStatus } from "@/features/capsules/types";
import { getNextUnlockRefreshMs } from "@/features/capsules/unlockRefresh";

describe("capsule feature logic", () => {
  it.each<[CapsuleStatus, string]>([
    ["locked", "Locked"],
    ["openable", "Ready to open"],
    ["opened", "Opened"],
    ["created_by_me", "Yours"],
    ["unavailable", "Unavailable"],
  ])("maps capsule status '%s' to '%s'", (status, expectedLabel) => {
    render(React.createElement(CapsuleStatusBadge, { status }));

    expect(screen.getByText(expectedLabel)).toBeTruthy();
  });
});

describe("capsule unlock refresh timing", () => {
  const now = Date.parse("2026-11-19T18:00:00.000Z");

  it("refetches just after the soonest locked capsule unlocks", () => {
    expect(
      getNextUnlockRefreshMs(
        [
          { unlock_at: "2026-11-19T18:10:00.000Z", opened_at: null },
          { unlock_at: "2026-11-19T18:05:00.000Z", opened_at: null },
        ],
        now
      )
    ).toBe(5 * 60 * 1000 + 1000);
  });

  it("ignores capsules that are already unlocked or opened", () => {
    expect(
      getNextUnlockRefreshMs(
        [
          { unlock_at: "2026-11-19T17:00:00.000Z", opened_at: null },
          { unlock_at: "2026-11-19T18:05:00.000Z", opened_at: "2026-11-19T17:30:00.000Z" },
        ],
        now
      )
    ).toBe(false);
  });

  it("re-checks far-off unlocks hourly", () => {
    expect(
      getNextUnlockRefreshMs([{ unlock_at: "2026-12-24T18:00:00.000Z", opened_at: null }], now)
    ).toBe(60 * 60 * 1000);
  });
});

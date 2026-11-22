import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

jest.mock("@/lib/supabase/client", () => ({ supabase: {} }));

import { mapTimelineRow } from "@/features/timeline/api/timelineApi";
import { TimelineItemCard } from "@/features/timeline/components/TimelineItemCard";
import type { TimelineItemRow } from "@/features/timeline/types";

function row(type: string, payload: Record<string, unknown>, createdAt = "2026-11-22T08:10:00.000Z") {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    couple_id: "22222222-2222-4222-8222-222222222222",
    actor_id: "33333333-3333-4333-8333-333333333333",
    type,
    payload,
    created_at: createdAt,
  } as TimelineItemRow;
}

function renderCard(item: TimelineItemRow) {
  return render(<TimelineItemCard item={mapTimelineRow(item)} />);
}

describe("timeline cards", () => {
  it("names a pulse once", () => {
    renderCard(row("presence_sent", { pulse_type: "miss_you", has_optional_message: true }));

    expect(screen.getByText("Pulse shared")).toBeTruthy();
    expect(screen.getAllByText(/miss you/i)).toHaveLength(1);
    expect(screen.getByText("Included a short note.")).toBeTruthy();
  });

  it("shows a ritual's category instead of repeating the day it happened", () => {
    renderCard(row("ritual_completed", { scheduled_for: "2026-11-22", category: "daily_checkin" }));

    expect(screen.getByText("Check-in")).toBeTruthy();
    expect(screen.queryByText(/^For /)).toBeNull();
  });

  it("mentions the ritual's day when it was answered on a later one", () => {
    renderCard(row("ritual_completed", { scheduled_for: "2026-11-20", category: "gratitude" }));

    expect(screen.getByText(/^For Nov 20, 2026/)).toBeTruthy();
  });

  it("doesn't repeat when an opened capsule was opened", () => {
    renderCard(
      row("capsule_opened", {
        unlock_at: "2026-11-21T09:00:00.000Z",
        opened_at: "2026-11-22T08:10:00.000Z",
      })
    );

    expect(screen.getByText("Memory capsule opened")).toBeTruthy();
    expect(screen.queryByText(/^Opened /)).toBeNull();
    expect(screen.getByText(/^Was set to open /)).toBeTruthy();
  });
});

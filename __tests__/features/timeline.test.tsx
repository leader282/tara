import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

jest.mock("@/lib/supabase/client", () => ({ supabase: {} }));

import { mapTimelineRow } from "@/features/timeline/api/timelineApi";
import { TimelineItemCard } from "@/features/timeline/components/TimelineItemCard";
import type { TimelineItemRow } from "@/features/timeline/types";

const PRESENCE_EVENT_ID = "44444444-4444-4444-8444-444444444444";

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

function renderCard(item: TimelineItemRow, options: { messages?: Map<string, string>; actorName?: string } = {}) {
  return render(
    <TimelineItemCard actorName={options.actorName ?? null} item={mapTimelineRow(item, options.messages)} />
  );
}

describe("timeline cards", () => {
  it("shows a pulse's note and who sent it", () => {
    renderCard(
      row("presence_sent", { presence_event_id: PRESENCE_EVENT_ID, pulse_type: "miss_you", has_optional_message: true }),
      { messages: new Map([[PRESENCE_EVENT_ID, "Sleep well, love"]]), actorName: "Asha" }
    );

    expect(screen.getByText("Asha sent a pulse")).toBeTruthy();
    expect(screen.getAllByText(/miss you/i)).toHaveLength(1);
    expect(screen.getByText("Sleep well, love")).toBeTruthy();
    expect(screen.queryByText("Included a short note.")).toBeNull();
  });

  it("falls back to saying there was a note when it can't be loaded", () => {
    renderCard(row("presence_sent", { presence_event_id: PRESENCE_EVENT_ID, pulse_type: "hug", has_optional_message: true }));

    expect(screen.getByText("Pulse shared")).toBeTruthy();
    expect(screen.getByText("Included a short note.")).toBeTruthy();
  });

  it("is read-only but still reads out everything it shows", () => {
    renderCard(
      row("presence_sent", { presence_event_id: PRESENCE_EVENT_ID, pulse_type: "miss_you", has_optional_message: true }),
      { messages: new Map([[PRESENCE_EVENT_ID, "Sleep well, love"]]), actorName: "You" }
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByLabelText(/^Presence pulse: You sent a pulse\. Miss you\. Sleep well, love\. /)).toBeTruthy();
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

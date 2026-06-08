import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

jest.mock("@/features/media/components/PrivateImage", () => {
  // Keep reveal-state tests focused on ritual rendering, not media fetch internals.
  const ReactModule = require("react");
  const { Text } = require("react-native");

  return {
    PrivateImage: () => ReactModule.createElement(Text, null, "Private image"),
  };
});

jest.mock("@/features/rituals/components/RitualResponseForm", () => {
  const ReactModule = require("react");
  const { Text } = require("react-native");

  return {
    RitualResponseForm: () => ReactModule.createElement(Text, null, "Ritual response form"),
  };
});

import { TodayRitualCard } from "@/features/rituals/components/TodayRitualCard";
import type { RitualTemplate, TodayRitualState } from "@/features/rituals/types";

const MY_USER_ID = "55555555-5555-4555-8555-555555555555";
const PARTNER_USER_ID = "66666666-6666-4666-8666-666666666666";

function createState(status: "completed_by_me_waiting" | "revealed"): TodayRitualState {
  const coupleRitual = {
    id: "77777777-7777-4777-8777-777777777777",
    couple_id: "88888888-8888-4888-8888-888888888888",
    ritual_template_id: "99999999-9999-4999-8999-999999999999",
    scheduled_for: "2026-08-14",
    status: status === "revealed" ? "completed" : "in_progress",
    created_at: "2026-08-14T09:00:00.000Z",
    updated_at: "2026-08-14T10:00:00.000Z",
  };

  const template: RitualTemplate = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "Daily check-in",
    description: "A calm moment to reconnect.",
    category: "daily_checkin",
    prompt: "What did you appreciate today?",
    input_type: "text",
    is_active: true,
    created_at: "2026-08-01T00:00:00.000Z",
  };

  const myCompletion = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    couple_ritual_id: coupleRitual.id,
    user_id: MY_USER_ID,
    text_response: "My answer",
    media_asset_id: null,
    created_at: "2026-08-14T09:30:00.000Z",
    updated_at: "2026-08-14T09:30:00.000Z",
  };

  const partnerCompletion = {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    couple_ritual_id: coupleRitual.id,
    user_id: PARTNER_USER_ID,
    text_response: "Partner answer",
    media_asset_id: null,
    created_at: "2026-08-14T09:45:00.000Z",
    updated_at: "2026-08-14T09:45:00.000Z",
  };

  return {
    status,
    ritual: {
      coupleRitual,
      template,
      myCompletion,
      partnerCompletion,
      revealState: {
        isRevealed: status === "revealed",
        hasCompleted: true,
        isWaitingForPartner: status !== "revealed",
        completedCount: status === "revealed" ? 2 : 1,
      },
    },
  };
}

describe("ritual feature logic", () => {
  it("shows waiting state when user has completed but reveal is pending", () => {
    render(
      React.createElement(TodayRitualCard, {
        state: createState("completed_by_me_waiting"),
      }),
    );

    expect(screen.getByText(/Your answer is saved/i)).toBeTruthy();
    expect(screen.queryByText("Both answers are revealed")).toBeNull();
  });

  it("shows revealed state when both responses are available", () => {
    render(
      React.createElement(TodayRitualCard, {
        partnerDisplayName: "Partner",
        state: createState("revealed"),
      }),
    );

    expect(screen.getByText("Both answers are revealed")).toBeTruthy();
    expect(screen.getByText("My answer")).toBeTruthy();
    expect(screen.getByText("Partner answer")).toBeTruthy();
  });
});

import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { RecentPulsesCard } from "@/features/presence/components/RecentPulsesCard";
import type { RecentPresencePulse } from "@/features/presence/types";

const USER_ID = "33333333-3333-4333-8333-333333333333";
const COUPLE_ID = "55555555-5555-4555-8555-555555555555";

function pulseSentMinutesAgo(id: string, minutesAgo: number): RecentPresencePulse {
  return {
    id,
    couple_id: COUPLE_ID,
    sender_id: USER_ID,
    type: "hug",
    optional_message: null,
    created_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

describe("RecentPulsesCard", () => {
  it("shows only pulses from the last hour", () => {
    render(
      <RecentPulsesCard
        currentUserId={USER_ID}
        isLoading={false}
        pulses={[
          pulseSentMinutesAgo("66666666-6666-4666-8666-666666666661", 10),
          pulseSentMinutesAgo("66666666-6666-4666-8666-666666666662", 120),
        ]}
      />,
    );

    expect(screen.getByText("10 minutes ago")).toBeTruthy();
    expect(screen.queryByText("2 hours ago")).toBeNull();
  });

  it("shows the empty state when no pulse is from the last hour", () => {
    render(
      <RecentPulsesCard
        currentUserId={USER_ID}
        isLoading={false}
        pulses={[pulseSentMinutesAgo("66666666-6666-4666-8666-666666666663", 90)]}
      />,
    );

    expect(screen.getByText("No pulses in the last hour.")).toBeTruthy();
  });
});

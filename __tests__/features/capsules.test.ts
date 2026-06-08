import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { CapsuleStatusBadge } from "@/features/capsules/components/CapsuleStatusBadge";
import type { CapsuleStatus } from "@/features/capsules/types";

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

import { describe, expect, it } from "@jest/globals";

import {
  clampMonthToRange,
  compareDateKeys,
  formatTimeKey,
  getMonthGrid,
  parseDateKey,
  parseTimeKey,
  shiftMonth,
  toDateKey,
  toTimeKey,
} from "@/lib/dates/calendar";

describe("calendar helpers", () => {
  it("round-trips local date keys", () => {
    expect(toDateKey(new Date(2026, 10, 5))).toBe("2026-11-05");
    expect(parseDateKey("2026-11-05")).toEqual({ year: 2026, month: 11, day: 5 });
  });

  it("rejects impossible or malformed dates", () => {
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(parseDateKey("2026-2-3")).toBeNull();
    expect(parseDateKey("")).toBeNull();
    expect(parseDateKey(null)).toBeNull();
  });

  it("compares date keys chronologically", () => {
    expect(compareDateKeys("2026-11-05", "2026-11-18")).toBe(-1);
    expect(compareDateKeys("2027-01-01", "2026-12-31")).toBe(1);
    expect(compareDateKeys("2026-11-18", "2026-11-18")).toBe(0);
  });

  it("builds a Sunday-first month grid padded to full weeks", () => {
    const grid = getMonthGrid(2026, 2);

    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(grid.flat().filter((day) => day !== null)).toHaveLength(28);
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("clamps a picked year's month into the allowed date range", () => {
    expect(clampMonthToRange({ year: 2026, month: 1 }, "2026-11-19")).toEqual({ year: 2026, month: 11 });
    expect(clampMonthToRange({ year: 2026, month: 12 }, undefined, "2026-11-19")).toEqual({
      year: 2026,
      month: 11,
    });
    expect(clampMonthToRange({ year: 2027, month: 3 }, "2026-11-19")).toEqual({ year: 2027, month: 3 });
    expect(clampMonthToRange({ year: 1995, month: 6 }, undefined, "2026-11-19")).toEqual({
      year: 1995,
      month: 6,
    });
  });

  it("parses and formats 24-hour time keys", () => {
    expect(parseTimeKey("21:30")).toEqual({ hours: 21, minutes: 30 });
    expect(parseTimeKey("24:00")).toBeNull();
    expect(toTimeKey({ hours: 7, minutes: 5 })).toBe("07:05");
    expect(formatTimeKey("21:30")).toBe("9:30 PM");
    expect(formatTimeKey("invalid")).toBeNull();
  });
});

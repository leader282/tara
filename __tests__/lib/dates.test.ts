import { describe, expect, it } from "@jest/globals";

import { getCountdownParts } from "@/lib/dates/countdown";
import { parseMeetupDateTimeFromFields } from "@/lib/dates/format";

describe("date helpers", () => {
  describe("getCountdownParts", () => {
    const now = new Date(2026, 5, 10, 9, 0, 0, 0);

    it("returns today state for same calendar day", () => {
      const targetDate = new Date(2026, 5, 10, 23, 59, 0, 0);

      expect(getCountdownParts(targetDate, now)).toEqual({
        status: "today",
        daysRemaining: 0,
        label: "You reunite today.",
      });
    });

    it("returns tomorrow state for next calendar day", () => {
      const targetDate = new Date(2026, 5, 11, 0, 1, 0, 0);

      expect(getCountdownParts(targetDate, now)).toEqual({
        status: "tomorrow",
        daysRemaining: 1,
        label: "You reunite tomorrow.",
      });
    });

    it("returns upcoming state for future dates", () => {
      const targetDate = new Date(2026, 5, 15, 12, 0, 0, 0);

      expect(getCountdownParts(targetDate, now)).toEqual({
        status: "upcoming",
        daysRemaining: 5,
        label: "5 days until you're together.",
      });
    });

    it("returns past state for earlier dates", () => {
      const targetDate = new Date(2026, 5, 9, 23, 59, 0, 0);

      expect(getCountdownParts(targetDate, now)).toEqual({
        status: "past",
        daysRemaining: -1,
        label: "That reunion date has passed.",
      });
    });
  });

  describe("parseMeetupDateTimeFromFields", () => {
    it("parses valid date and time fields", () => {
      const isoString = parseMeetupDateTimeFromFields("2026-08-14", "09:30");

      expect(isoString).not.toBeNull();

      const parsedDate = new Date(isoString as string);
      expect(parsedDate.getFullYear()).toBe(2026);
      expect(parsedDate.getMonth()).toBe(7);
      expect(parsedDate.getDate()).toBe(14);
      expect(parsedDate.getHours()).toBe(9);
      expect(parsedDate.getMinutes()).toBe(30);
    });

    it("uses the default fallback time when time is omitted", () => {
      const isoString = parseMeetupDateTimeFromFields("2026-08-14", "");

      expect(isoString).not.toBeNull();

      const parsedDate = new Date(isoString as string);
      expect(parsedDate.getHours()).toBe(12);
      expect(parsedDate.getMinutes()).toBe(0);
    });

    it("returns null for invalid date or invalid time", () => {
      expect(parseMeetupDateTimeFromFields("2026-02-30", "09:30")).toBeNull();
      expect(parseMeetupDateTimeFromFields("2026-08-14", "25:00")).toBeNull();
    });
  });
});

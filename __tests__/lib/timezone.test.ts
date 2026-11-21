import { describe, expect, it } from "@jest/globals";

import {
  describeTimeDifference,
  getDayPeriod,
  getHourInTimeZone,
  getTimezoneOffsetMinutes,
} from "@/lib/dates/timezone";

const WINTER_INSTANT = new Date("2026-01-15T12:00:00.000Z");

describe("timezone helpers", () => {
  it("reads fixed and DST-aware offsets", () => {
    expect(getTimezoneOffsetMinutes("Asia/Kolkata", WINTER_INSTANT)).toBe(330);
    expect(getTimezoneOffsetMinutes("America/New_York", WINTER_INSTANT)).toBe(-300);
    expect(getTimezoneOffsetMinutes("Not/AZone", WINTER_INSTANT)).toBe(0);
  });

  it("reads the hour in another time zone", () => {
    expect(getHourInTimeZone(WINTER_INSTANT, "Asia/Kolkata")).toBe(17);
    expect(getHourInTimeZone(WINTER_INSTANT, "UTC")).toBe(12);
  });

  it("maps hours to a day period", () => {
    expect(getDayPeriod(6)).toBe("morning");
    expect(getDayPeriod(13)).toBe("afternoon");
    expect(getDayPeriod(18)).toBe("evening");
    expect(getDayPeriod(23)).toBe("night");
    expect(getDayPeriod(2)).toBe("night");
  });

  it("describes the partner clock relative to this device", () => {
    const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(describeTimeDifference(deviceTimeZone, WINTER_INSTANT)).toBe("Same time as you");

    const deviceOffset = -WINTER_INSTANT.getTimezoneOffset();
    const kolkataDifference = 330 - deviceOffset;
    const description = describeTimeDifference("Asia/Kolkata", WINTER_INSTANT);

    if (kolkataDifference === 0) {
      expect(description).toBe("Same time as you");
    } else {
      expect(description).toMatch(kolkataDifference > 0 ? /ahead of you$/ : /behind you$/);
    }
  });
});

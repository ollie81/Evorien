import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDistanceToNow, formatEventTime } from "./format-date";

describe("formatDistanceToNow", () => {
  const now = new Date("2026-01-15T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for anything under a minute", () => {
    expect(formatDistanceToNow(new Date(now.getTime() - 30_000).toISOString())).toBe("just now");
  });

  it("formats minutes ago", () => {
    expect(formatDistanceToNow(new Date(now.getTime() - 5 * 60_000).toISOString())).toBe(
      "5 minutes ago"
    );
  });

  it("formats hours ago", () => {
    expect(formatDistanceToNow(new Date(now.getTime() - 3 * 3_600_000).toISOString())).toBe(
      "3 hours ago"
    );
  });

  it("formats days ago", () => {
    expect(formatDistanceToNow(new Date(now.getTime() - 2 * 86_400_000).toISOString())).toBe(
      "2 days ago"
    );
  });
});

describe("formatEventTime", () => {
  it("includes the month and day of the start time", () => {
    expect(formatEventTime("2026-09-12T18:00:00.000Z", null)).toContain("Sep 12");
  });

  it("joins a same-day range with an en dash, without repeating the date", () => {
    const result = formatEventTime("2026-09-12T18:00:00.000Z", "2026-09-12T20:00:00.000Z");
    expect(result).toContain("–");
    expect(result.match(/Sep 12/g)).toHaveLength(1);
  });

  it("shows the full date on both ends of a multi-day range", () => {
    const result = formatEventTime("2026-09-12T18:00:00.000Z", "2026-09-14T20:00:00.000Z");
    expect(result).toContain("Sep 12");
    expect(result).toContain("Sep 14");
  });
});

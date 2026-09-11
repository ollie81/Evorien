import { describe, expect, it } from "vitest";
import { wantsDetailedResponse } from "./complexity";

describe("wantsDetailedResponse", () => {
  it("is false for a short, normal question", () => {
    expect(wantsDetailedResponse("What should I work on next?")).toBe(false);
  });

  it("is true for a message containing a detail keyword", () => {
    expect(wantsDetailedResponse("Can you give me a detailed breakdown of my Passport?")).toBe(true);
  });

  it("is true for a long message even without a keyword", () => {
    expect(wantsDetailedResponse("a".repeat(300))).toBe(true);
  });

  it("is case-insensitive on keywords", () => {
    expect(wantsDetailedResponse("Walk Me Through how matching works")).toBe(true);
  });
});

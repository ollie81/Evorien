import { describe, expect, it } from "vitest";
import { getPlanLimits, planLabel } from "./plans";

describe("getPlanLimits", () => {
  it("returns a positive AI message limit for PRO", () => {
    expect(getPlanLimits("PRO").aiDailyMessageLimit).toBeGreaterThan(0);
  });

  it("returns a positive AI message limit for BUSINESS", () => {
    expect(getPlanLimits("BUSINESS").aiDailyMessageLimit).toBeGreaterThan(0);
  });
});

describe("planLabel", () => {
  it("labels every plan", () => {
    expect(planLabel("FREE")).toBe("Free");
    expect(planLabel("PRO")).toBe("Evorien Pro");
    expect(planLabel("BUSINESS")).toBe("Business");
  });
});

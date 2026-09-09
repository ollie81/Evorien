import { describe, expect, it } from "vitest";
import { MEMORY_TYPES, memoryTypeLabel } from "./memory-types";

describe("memoryTypeLabel", () => {
  it("labels every memory type", () => {
    for (const type of MEMORY_TYPES) {
      expect(memoryTypeLabel(type)).not.toBe("");
    }
  });

  it("labels a couple of specific types as expected", () => {
    expect(memoryTypeLabel("GOAL")).toBe("Goals");
    expect(memoryTypeLabel("PROJECT_CONTEXT")).toBe("Project context");
  });

  it("never includes a SKILL type — skills are a verified Passport field, not a memory", () => {
    expect(MEMORY_TYPES).not.toContain("SKILL");
  });
});

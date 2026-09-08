import { describe, expect, it } from "vitest";
import {
  contributionTypeLabel,
  opportunityTypeLabel,
  projectStageLabel,
  projectStatusLabel,
  reputationLevelLabel,
  roleLabel,
  verificationLevelLabel,
} from "./roles";

describe("roleLabel", () => {
  it("labels a known code", () => {
    expect(roleLabel("DEVELOPER")).toBe("Developer");
  });

  it("falls back to the raw code for an unknown value", () => {
    expect(roleLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});

describe("contributionTypeLabel", () => {
  it("labels a known code", () => {
    expect(contributionTypeLabel("EQUIPMENT")).toBe("Equipment / resources");
  });

  it("falls back to the raw code for an unknown value", () => {
    expect(contributionTypeLabel("MADE_UP")).toBe("MADE_UP");
  });
});

describe("projectStageLabel", () => {
  it("labels every defined stage", () => {
    expect(projectStageLabel("IDEA")).toBe("Idea");
    expect(projectStageLabel("MVP")).toBe("MVP");
    expect(projectStageLabel("GROWING")).toBe("Growing");
  });
});

describe("projectStatusLabel", () => {
  it("labels every defined status", () => {
    expect(projectStatusLabel("ACTIVE")).toBe("Active");
    expect(projectStatusLabel("COMPLETED")).toBe("Completed");
    expect(projectStatusLabel("ARCHIVED")).toBe("Archived");
  });
});

describe("opportunityTypeLabel", () => {
  it("labels a known code", () => {
    expect(opportunityTypeLabel("PROJECT")).toBe("Project opportunity");
  });
});

describe("verificationLevelLabel", () => {
  it("labels known levels", () => {
    expect(verificationLevelLabel("IDENTITY_VERIFIED")).toBe("Identity Verified");
    expect(verificationLevelLabel("FOUNDER_VERIFIED")).toBe("Founder Verified");
  });

  it("defaults to Basic for null, undefined, or unknown", () => {
    expect(verificationLevelLabel(null)).toBe("Basic");
    expect(verificationLevelLabel(undefined)).toBe("Basic");
    expect(verificationLevelLabel("NOT_A_LEVEL")).toBe("Basic");
  });
});

describe("reputationLevelLabel", () => {
  it("labels known levels", () => {
    expect(reputationLevelLabel("FOUNDING_CONTRIBUTOR")).toBe("Founding Contributor");
  });

  it("defaults to Member for null, undefined, or unknown", () => {
    expect(reputationLevelLabel(null)).toBe("Member");
    expect(reputationLevelLabel(undefined)).toBe("Member");
    expect(reputationLevelLabel("NOT_A_LEVEL")).toBe("Member");
  });
});

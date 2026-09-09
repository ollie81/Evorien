import { describe, expect, it } from "vitest";
import { hasEnoughSignal, scoreCandidate, type CandidateInput, type MatchingContext } from "./score";

const emptyContext = (viewer: MatchingContext["viewer"]): MatchingContext => ({
  viewer,
  viewerSkillIds: new Set(),
  neededSkillProjectNames: new Map(),
  viewerMemoryKeywords: [],
});

const baseCandidate: CandidateInput = {
  pillars: [],
  roles: [],
  looking_for: null,
  contribution_summary: null,
  reputation_level: "MEMBER",
  skills: [],
};

describe("hasEnoughSignal", () => {
  it("is false for a completely blank Passport", () => {
    expect(
      hasEnoughSignal({ pillars: [], roles: [], looking_for: null, contribution_summary: null, reputation_level: "MEMBER" }, 0)
    ).toBe(false);
  });

  it("is true with at least one pillar", () => {
    expect(
      hasEnoughSignal(
        { pillars: ["TECHNOLOGY"], roles: [], looking_for: null, contribution_summary: null, reputation_level: "MEMBER" },
        0
      )
    ).toBe(true);
  });

  it("is true with at least one skill", () => {
    expect(
      hasEnoughSignal({ pillars: [], roles: [], looking_for: null, contribution_summary: null, reputation_level: "MEMBER" }, 1)
    ).toBe(true);
  });

  it("is true with non-empty looking_for", () => {
    expect(
      hasEnoughSignal(
        { pillars: [], roles: [], looking_for: "A designer", contribution_summary: null, reputation_level: "MEMBER" },
        0
      )
    ).toBe(true);
  });
});

describe("scoreCandidate", () => {
  it("scores zero with no reasons when nothing overlaps", () => {
    const viewer = { pillars: ["ARTS"], roles: [], looking_for: null, contribution_summary: null, reputation_level: "MEMBER" };
    const candidate: CandidateInput = { ...baseCandidate, pillars: ["TECHNOLOGY"] };
    const result = scoreCandidate(candidate, emptyContext(viewer));
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });

  it("rewards a shared pillar with a human-readable reason", () => {
    const viewer = { pillars: ["TECHNOLOGY"], roles: [], looking_for: null, contribution_summary: null, reputation_level: "MEMBER" };
    const candidate: CandidateInput = { ...baseCandidate, pillars: ["TECHNOLOGY"] };
    const result = scoreCandidate(candidate, emptyContext(viewer));
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some((r) => r.includes("Technology"))).toBe(true);
  });

  it("weights filling an open project need above a merely shared skill", () => {
    const viewer = { pillars: [], roles: [], looking_for: null, contribution_summary: null, reputation_level: "MEMBER" };
    const context: MatchingContext = {
      ...emptyContext(viewer),
      neededSkillProjectNames: new Map([["skill-1", "Solarpunk App"]]),
    };
    const fillsNeed: CandidateInput = {
      ...baseCandidate,
      skills: [{ skillId: "skill-1", name: "UI Design", isVerified: false }],
    };
    const justShared: CandidateInput = {
      ...baseCandidate,
      skills: [{ skillId: "skill-2", name: "UI Design", isVerified: false }],
    };
    const contextWithSharedSkill: MatchingContext = { ...context, viewerSkillIds: new Set(["skill-2"]) };

    const fillsResult = scoreCandidate(fillsNeed, context);
    const sharedResult = scoreCandidate(justShared, contextWithSharedSkill);

    expect(fillsResult.score).toBeGreaterThan(sharedResult.score);
    expect(fillsResult.reasons[0]).toContain("Solarpunk App");
  });

  it("gives a verified skill an extra bonus over an unverified one", () => {
    const viewer = { pillars: [], roles: [], looking_for: null, contribution_summary: null, reputation_level: "MEMBER" };
    const context: MatchingContext = { ...emptyContext(viewer), viewerSkillIds: new Set(["skill-1"]) };
    const verified: CandidateInput = { ...baseCandidate, skills: [{ skillId: "skill-1", name: "Rust", isVerified: true }] };
    const unverified: CandidateInput = { ...baseCandidate, skills: [{ skillId: "skill-1", name: "Rust", isVerified: false }] };

    expect(scoreCandidate(verified, context).score).toBeGreaterThan(scoreCandidate(unverified, context).score);
  });

  it("matches a candidate's role against the viewer's own looking_for text", () => {
    const viewer = {
      pillars: [],
      roles: [],
      looking_for: "Looking for a Designer to help with branding",
      contribution_summary: null,
      reputation_level: "MEMBER",
    };
    const candidate: CandidateInput = { ...baseCandidate, roles: ["DESIGNER"] };
    const result = scoreCandidate(candidate, emptyContext(viewer));
    expect(result.score).toBeGreaterThan(0);
  });

  it("caps reasons at three even when every signal fires", () => {
    const viewer = {
      pillars: ["TECHNOLOGY", "ARTS"],
      roles: [],
      looking_for: "Looking for a Designer",
      contribution_summary: "renewable energy",
      reputation_level: "MEMBER",
    };
    const context: MatchingContext = {
      viewer,
      viewerSkillIds: new Set(["skill-2"]),
      neededSkillProjectNames: new Map([["skill-1", "Solarpunk App"]]),
      viewerMemoryKeywords: ["renewable"],
    };
    const candidate: CandidateInput = {
      pillars: ["TECHNOLOGY", "ARTS"],
      roles: ["DESIGNER"],
      looking_for: "renewable energy projects",
      contribution_summary: null,
      reputation_level: "MEMBER",
      skills: [
        { skillId: "skill-1", name: "UI Design", isVerified: true },
        { skillId: "skill-2", name: "Illustration", isVerified: false },
      ],
    };
    const result = scoreCandidate(candidate, context);
    expect(result.reasons.length).toBeLessThanOrEqual(3);
  });
});

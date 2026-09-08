import { describe, expect, it } from "vitest";
import { profileDisplayName } from "./types";

describe("profileDisplayName", () => {
  it("prefers full_name when present", () => {
    expect(
      profileDisplayName({ full_name: "Ada Lovelace", username: "ada", passport_id: "EVR-000001" })
    ).toBe("Ada Lovelace");
  });

  it("falls back to username when full_name is missing", () => {
    expect(profileDisplayName({ full_name: null, username: "ada", passport_id: "EVR-000001" })).toBe(
      "ada"
    );
  });

  it("falls back to username when full_name is blank", () => {
    expect(profileDisplayName({ full_name: "   ", username: "ada", passport_id: "EVR-000001" })).toBe(
      "ada"
    );
  });

  it("falls back to the passport id when both are missing", () => {
    expect(profileDisplayName({ full_name: null, username: null, passport_id: "EVR-000001" })).toBe(
      "EVR-000001"
    );
  });

  it("falls back to the passport id when both are blank", () => {
    expect(profileDisplayName({ full_name: "", username: "   ", passport_id: "EVR-000001" })).toBe(
      "EVR-000001"
    );
  });
});

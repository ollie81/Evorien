import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(slugify("Ollieen Network")).toMatch(/^ollieen-network-[a-z0-9]{6}$/);
  });

  it("strips punctuation", () => {
    expect(slugify("Let's Build! (v2)")).toMatch(/^lets-build-v2-[a-z0-9]{6}$/);
  });

  it("collapses repeated whitespace into a single hyphen", () => {
    expect(slugify("too   many    spaces")).toMatch(/^too-many-spaces-[a-z0-9]{6}$/);
  });

  it("falls back to a generic base when nothing alphanumeric survives", () => {
    expect(slugify("!!!")).toMatch(/^project-[a-z0-9]{6}$/);
  });

  it("gives two calls with the same name different slugs", () => {
    expect(slugify("Duplicate Name")).not.toBe(slugify("Duplicate Name"));
  });
});

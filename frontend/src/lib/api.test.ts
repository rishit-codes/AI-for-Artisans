import { describe, it, expect } from "vitest";
import { resolveImageUrl } from "./api";

describe("resolveImageUrl", () => {
  it("returns undefined for empty/missing input", () => {
    expect(resolveImageUrl(undefined)).toBeUndefined();
    expect(resolveImageUrl(null)).toBeUndefined();
    expect(resolveImageUrl("")).toBeUndefined();
  });

  it("passes absolute http(s) URLs through unchanged", () => {
    expect(resolveImageUrl("https://example.com/x.jpg")).toBe("https://example.com/x.jpg");
    expect(resolveImageUrl("http://example.com/x.jpg")).toBe("http://example.com/x.jpg");
  });

  it("prefixes backend-served /uploads/ paths with the API base URL", () => {
    const resolved = resolveImageUrl("/uploads/products/abc.jpg");
    expect(resolved).toContain("/uploads/products/abc.jpg");
    expect(resolved?.startsWith("http")).toBe(true);
  });

  it("leaves other relative paths (e.g. bundled /public assets) untouched", () => {
    expect(resolveImageUrl("/images/craft-pottery.jpg")).toBe("/images/craft-pottery.jpg");
  });
});

import { describe, it, expect } from "vitest";
import { example } from "../impl/example";

describe("example behavior", () => {
  it("returns the example value", () => {
    expect(example()).toBe("example");
  });
});

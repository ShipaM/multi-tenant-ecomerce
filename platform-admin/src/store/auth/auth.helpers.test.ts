import { describe, expect, it } from "vitest";

import { buildAvatarName } from "./auth.helpers";

describe("buildAvatarName", () => {
  it("uses the initials of the first and last word of the name", () => {
    expect(buildAvatarName("jane van doe")).toBe("JD");
  });

  it("uses a single initial for a one-word name", () => {
    expect(buildAvatarName("jane")).toBe("J");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(buildAvatarName("  jane    doe  ")).toBe("JD");
  });

  it("falls back to the first letter of the email when the name is empty", () => {
    expect(buildAvatarName("", "jane@example.com")).toBe("J");
    expect(buildAvatarName("   ", "  jane@example.com")).toBe("J");
    expect(buildAvatarName(null, "jane@example.com")).toBe("J");
    expect(buildAvatarName(undefined, "jane@example.com")).toBe("J");
  });

  it("falls back to a question mark when there is nothing to use", () => {
    expect(buildAvatarName()).toBe("?");
    expect(buildAvatarName("", "")).toBe("?");
    expect(buildAvatarName("", "   ")).toBe("?");
  });
});

import { describe, expect, it } from "vitest";

import { focusOnMount } from "./focus";

describe("focusOnMount", () => {
  it("focuses the element", () => {
    const heading = document.createElement("h1");
    heading.tabIndex = -1;
    document.body.append(heading);

    focusOnMount(heading);

    expect(heading).toHaveFocus();
    heading.remove();
  });

  it("ignores a missing element", () => {
    expect(() => focusOnMount(null)).not.toThrow();
  });
});

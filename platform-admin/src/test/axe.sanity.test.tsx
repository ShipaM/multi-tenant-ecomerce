import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "./axe";

describe("expectNoA11yViolations", () => {
  it("passes for accessible markup", async () => {
    const { container } = render(
      <>
        <label htmlFor="name">Name</label>
        <input id="name" />
      </>,
    );

    await expectNoA11yViolations(container);
  });

  it("fails for an unlabeled input and an image without alt text", async () => {
    const { container } = render(
      <>
        <input />
        <img src="logo.png" />
      </>,
    );

    await expect(expectNoA11yViolations(container)).rejects.toThrow(
      /label|image-alt/,
    );
  });
});

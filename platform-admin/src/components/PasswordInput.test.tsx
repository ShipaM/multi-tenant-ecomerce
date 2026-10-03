import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "@/test/axe";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("starts masked", () => {
    render(<PasswordInput placeholder="Password" />);

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
  });

  it("reveals the value when the toggle is clicked, and masks it again on a second click", () => {
    render(<PasswordInput placeholder="Password" />);

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "text",
    );
    expect(
      screen.getByRole("button", { name: "Show password", pressed: true }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("forwards other input props through", () => {
    render(<PasswordInput placeholder="Password" disabled />);

    expect(screen.getByPlaceholderText("Password")).toBeDisabled();
  });

  describe("accessibility", () => {
    it("exposes the toggle as a pressed state instead of renaming it", () => {
      render(<PasswordInput placeholder="Password" />);
      const toggle = screen.getByRole("button", { name: "Show password" });

      expect(toggle).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("hides the decorative eye icon from assistive tech", () => {
      render(<PasswordInput placeholder="Password" />);

      expect(
        screen
          .getByRole("button", { name: "Show password" })
          .querySelector("svg"),
      ).toHaveAttribute("aria-hidden", "true");
    });

    it("has no axe violations", async () => {
      const { container } = render(
        <>
          <label htmlFor="pw">Password</label>
          <PasswordInput id="pw" />
        </>,
      );

      await expectNoA11yViolations(container);
    });
  });
});

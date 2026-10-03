import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "@/test/axe";
import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("renders its children and defaults to type=submit when not loading", () => {
    render(
      <SubmitButton loading={false} loadingText="Saving...">
        Save
      </SubmitButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).not.toBeDisabled();
  });

  it("shows the loading text while loading, and disables itself", () => {
    render(
      <SubmitButton loading loadingText="Saving...">
        Save
      </SubmitButton>,
    );

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("stays disabled when disabled is passed explicitly, even while not loading", () => {
    render(
      <SubmitButton loading={false} loadingText="Saving..." disabled>
        Save
      </SubmitButton>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
  });

  it("respects an explicit type override", () => {
    render(
      <SubmitButton loading={false} loadingText="Saving..." type="button">
        Save
      </SubmitButton>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  describe("accessibility", () => {
    it("marks the button busy and keeps the decorative spinner out of its name", () => {
      render(
        <SubmitButton loading loadingText="Saving...">
          Save
        </SubmitButton>,
      );

      const button = screen.getByRole("button", { name: "Saving..." });
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("announces progress through a live region while loading", () => {
      const { rerender } = render(
        <SubmitButton loading={false} loadingText="Saving...">
          Save
        </SubmitButton>,
      );
      expect(screen.getByRole("status")).toBeEmptyDOMElement();

      rerender(
        <SubmitButton loading loadingText="Saving...">
          Save
        </SubmitButton>,
      );

      expect(screen.getByRole("status")).toHaveTextContent("Please wait");
    });

    it("is not busy when idle", () => {
      render(
        <SubmitButton loading={false} loadingText="Saving...">
          Save
        </SubmitButton>,
      );

      expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute(
        "aria-busy",
      );
    });

    it("has no axe violations idle or loading", async () => {
      const { container, rerender } = render(
        <SubmitButton loading={false} loadingText="Saving...">
          Save
        </SubmitButton>,
      );
      await expectNoA11yViolations(container);

      rerender(
        <SubmitButton loading loadingText="Saving...">
          Save
        </SubmitButton>,
      );
      await expectNoA11yViolations(container);
    });
  });
});

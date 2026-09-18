import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("renders its children and defaults to type=submit when not loading", () => {
    render(<SubmitButton loading={false} loadingText="Saving...">Save</SubmitButton>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).not.toBeDisabled();
  });

  it("shows the loading text and a status spinner while loading, and disables itself", () => {
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
});

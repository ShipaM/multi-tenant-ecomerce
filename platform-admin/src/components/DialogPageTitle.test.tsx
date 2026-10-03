import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { expectNoA11yViolations } from "@/test/axe";
import { DialogPageTitle } from "./DialogPageTitle";

const renderInDialog = (ui: React.ReactNode) =>
  render(
    <Dialog open>
      <DialogContent>{ui}</DialogContent>
    </Dialog>,
  );

describe("DialogPageTitle", () => {
  it("names and describes the dialog it is in", () => {
    renderInDialog(
      <DialogPageTitle
        title="Edit profile"
        description="Update your details"
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Edit profile" });
    expect(dialog).toHaveAccessibleDescription("Update your details");
  });

  it("renders the title as a heading", () => {
    renderInDialog(<DialogPageTitle title="Edit profile" description="x" />);

    expect(
      screen.getByRole("heading", { name: "Edit profile" }),
    ).toBeInTheDocument();
  });

  it("applies custom class names to the wrapper and the title", () => {
    renderInDialog(
      <DialogPageTitle
        title="Edit profile"
        description="x"
        className="mb-4"
        classNameTitle="font-semibold"
      />,
    );

    const heading = screen.getByRole("heading", { name: "Edit profile" });
    expect(heading).toHaveClass("font-semibold");
    expect(heading.parentElement).toHaveClass("mb-4");
  });

  it("has no axe violations", async () => {
    renderInDialog(<DialogPageTitle title="Edit profile" description="x" />);

    await expectNoA11yViolations(screen.getByRole("dialog"));
  });
});

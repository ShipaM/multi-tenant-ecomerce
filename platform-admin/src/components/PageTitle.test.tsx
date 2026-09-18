import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageTitle } from "./PageTitle";

describe("PageTitle", () => {
  it("renders the title as a heading", () => {
    render(<PageTitle title="Account settings" />);

    expect(
      screen.getByRole("heading", { name: "Account settings" }),
    ).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<PageTitle title="Account settings" description="Manage your profile" />);

    expect(screen.getByText("Manage your profile")).toBeInTheDocument();
  });

  it("omits the description paragraph when none is given", () => {
    render(<PageTitle title="Account settings" />);

    expect(screen.queryByText(/manage/i)).not.toBeInTheDocument();
  });

  it("applies custom class names to the title and description", () => {
    render(
      <PageTitle
        title="Account settings"
        description="Manage your profile"
        classNameTitle="text-red-500"
        classNameDescription="text-blue-500"
        className="mb-4"
      />,
    );

    expect(screen.getByRole("heading")).toHaveClass("text-red-500");
    expect(screen.getByText("Manage your profile")).toHaveClass(
      "text-blue-500",
    );
    expect(screen.getByRole("heading").parentElement).toHaveClass("mb-4");
  });
});

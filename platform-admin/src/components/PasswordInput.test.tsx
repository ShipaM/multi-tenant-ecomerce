import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("starts masked", () => {
    render(<PasswordInput placeholder="Password" />);

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("button", { name: "Show Password" }),
    ).toBeInTheDocument();
  });

  it("reveals the value when the toggle is clicked, and masks it again on a second click", () => {
    render(<PasswordInput placeholder="Password" />);

    fireEvent.click(screen.getByRole("button", { name: "Show Password" }));

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "text",
    );
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("forwards other input props through", () => {
    render(<PasswordInput placeholder="Password" disabled />);

    expect(screen.getByPlaceholderText("Password")).toBeDisabled();
  });
});

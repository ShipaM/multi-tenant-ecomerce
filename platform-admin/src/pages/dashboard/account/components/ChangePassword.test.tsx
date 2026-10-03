import { fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithStore } from "@/test/render-with-store";
import { expectNoA11yViolations } from "@/test/axe";
import { ChangePassword } from "./ChangePassword";

const changePassword = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { changePassword } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const openDialog = () =>
  fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
const current = () => screen.getByLabelText("Current Password");
const next = () => screen.getByLabelText("New Password");
const confirm = () => screen.getByLabelText("Confirm Password");
const save = () => screen.getByRole("button", { name: /Save changes/ });

const fill = (a = "old-password", b = "new-password-1", c = b) => {
  fireEvent.change(current(), { target: { value: a } });
  fireEvent.change(next(), { target: { value: b } });
  fireEvent.change(confirm(), { target: { value: c } });
};

const openAndWait = async () => {
  openDialog();
  await screen.findByRole("dialog");
};

describe("ChangePassword", () => {
  beforeEach(() => {
    changePassword.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("starts closed", () => {
    renderWithStore(<ChangePassword />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a dialog with three empty password fields", async () => {
    renderWithStore(<ChangePassword />);

    await openAndWait();

    for (const input of [current(), next(), confirm()]) {
      expect(input).toHaveValue("");
      expect(input).toHaveAttribute("type", "password");
    }
  });

  it("will not save until every field is filled", async () => {
    renderWithStore(<ChangePassword />);
    await openAndWait();
    expect(save()).toBeDisabled();
    expect(screen.getByText("No changes to save")).toBeInTheDocument();

    fireEvent.change(current(), { target: { value: "old-password" } });
    fireEvent.change(next(), { target: { value: "new-password-1" } });
    expect(save()).toBeDisabled();

    fireEvent.change(confirm(), { target: { value: "new-password-1" } });

    expect(save()).toBeEnabled();
    expect(screen.queryByText("No changes to save")).not.toBeInTheDocument();
  });

  it("will not save while the confirmation differs", async () => {
    renderWithStore(<ChangePassword />);
    await openAndWait();

    fill("old-password", "new-password-1", "other-password");

    expect(save()).toBeDisabled();
  });

  it("refuses to submit mismatching passwords even when the form is submitted directly", async () => {
    renderWithStore(<ChangePassword />);
    await openAndWait();
    fill("old-password", "new-password-1", "other-password");

    fireEvent.submit(save().closest("form")!);

    expect(
      await screen.findByText("Password does not match"),
    ).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password, confirms it and closes the dialog", async () => {
    changePassword.mockResolvedValue({
      message: "Password changed",
      user: { id: "u1", email: "jane@example.com", fullName: "Jane Doe" },
    });
    renderWithStore(<ChangePassword />);
    await openAndWait();

    fill();
    fireEvent.click(save());

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password",
      password: "new-password-1",
    });
    expect(toast.success).toHaveBeenCalledWith("Password changed");
  });

  it("keeps the dialog open and shows the error when the change fails", async () => {
    changePassword.mockRejectedValue(new Error("network down"));
    renderWithStore(<ChangePassword />);
    await openAndWait();

    fill();
    fireEvent.click(save());

    expect(
      await screen.findByText("Failed to update the current user"),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to update the current user",
    );
  });

  it("falls back to a generic message when the failure is not a string", async () => {
    renderWithStore(<ChangePassword />, {
      dispatchOutcome: { rejects: new Error("boom") },
    });
    await openAndWait();

    fill();
    fireEvent.click(save());

    expect(
      await screen.findByText("Failed to change the password"),
    ).toBeInTheDocument();
  });

  it("forgets an old error when it is opened again", async () => {
    renderWithStore(<ChangePassword />);
    await openAndWait();
    fill("old-password", "new-password-1", "other-password");
    fireEvent.submit(save().closest("form")!);
    await screen.findByText("Password does not match");

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await openAndWait();

    expect(
      screen.queryByText("Password does not match"),
    ).not.toBeInTheDocument();
  });

  it("locks the form and shows progress while saving", async () => {
    changePassword.mockReturnValue(new Promise(() => {}));
    renderWithStore(<ChangePassword />);
    await openAndWait();

    fill();
    fireEvent.click(save());

    const busy = await screen.findByRole("button", { name: /Saving changes/ });
    expect(busy).toBeDisabled();
    expect(current()).toBeDisabled();
    expect(next()).toBeDisabled();
    expect(confirm()).toBeDisabled();
  });

  it("has no axe violations while open", async () => {
    renderWithStore(<ChangePassword />);
    await openAndWait();

    await expectNoA11yViolations(screen.getByRole("dialog"));
  });
});

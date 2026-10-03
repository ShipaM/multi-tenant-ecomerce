import { fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeUser } from "@/test/fixtures";
import { renderWithStore } from "@/test/render-with-store";
import { expectNoA11yViolations } from "@/test/axe";
import { EditProfile } from "./EditProfile";

const updateUser = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { updateUser } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const user = makeUser();

const openDialog = () =>
  fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
const field = (name: string) => screen.getByLabelText(name);
const save = () => screen.getByRole("button", { name: /Save changes/ });

describe("EditProfile", () => {
  beforeEach(() => {
    updateUser.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("starts closed", () => {
    renderWithStore(<EditProfile user={user} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a dialog filled with the current profile", async () => {
    renderWithStore(<EditProfile user={user} />);

    openDialog();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(field("Full name")).toHaveValue("Jane Doe");
    expect(field("Email")).toHaveValue("jane@example.com");
    expect(field("Phone")).toHaveValue("555-0100");
    expect(field("Profile image")).toHaveValue("");
  });

  it("will not save until something changes", async () => {
    renderWithStore(<EditProfile user={user} />);
    openDialog();
    await screen.findByRole("dialog");

    expect(save()).toBeDisabled();
    expect(screen.getByText("No changes to save")).toBeInTheDocument();

    fireEvent.change(field("Phone"), { target: { value: "555-0199" } });

    expect(save()).toBeEnabled();
    expect(screen.queryByText("No changes to save")).not.toBeInTheDocument();
  });

  it.each([
    ["Full name", "Jane Roe"],
    ["Email", "roe@example.com"],
    ["Phone", "555-0199"],
    ["Profile image", "https://img.example.com/jane.png"],
  ])("treats a changed %s as a change", async (label, value) => {
    renderWithStore(<EditProfile user={user} />);
    openDialog();
    await screen.findByRole("dialog");

    fireEvent.change(field(label), { target: { value } });

    expect(save()).toBeEnabled();
  });

  it("saves the profile, confirms it and closes the dialog", async () => {
    updateUser.mockResolvedValue({
      message: "Profile updated",
      user: { ...user, phone: "555-0199" },
    });
    renderWithStore(<EditProfile user={user} />);
    openDialog();
    await screen.findByRole("dialog");

    fireEvent.change(field("Phone"), { target: { value: "555-0199" } });
    fireEvent.click(save());

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(updateUser).toHaveBeenCalledWith({
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "555-0199",
      profileImage: undefined,
    });
    expect(toast.success).toHaveBeenCalledWith("Profile updated");
  });

  it("keeps the dialog open and shows the error when saving fails", async () => {
    updateUser.mockRejectedValue(new Error("network down"));
    renderWithStore(<EditProfile user={user} />);
    openDialog();
    await screen.findByRole("dialog");

    fireEvent.change(field("Phone"), { target: { value: "555-0199" } });
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
    renderWithStore(<EditProfile user={user} />, {
      dispatchOutcome: { rejects: new Error("boom") },
    });
    openDialog();
    await screen.findByRole("dialog");

    fireEvent.change(field("Phone"), { target: { value: "555-0199" } });
    fireEvent.click(save());

    expect(
      await screen.findByText("Failed to update the profile"),
    ).toBeInTheDocument();
  });

  it("discards unsaved edits and old errors when it is opened again", async () => {
    updateUser.mockRejectedValue(new Error("network down"));
    renderWithStore(<EditProfile user={user} />);
    openDialog();
    await screen.findByRole("dialog");
    fireEvent.change(field("Phone"), { target: { value: "555-0199" } });
    fireEvent.click(save());
    await screen.findByText("Failed to update the current user");

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    openDialog();
    await screen.findByRole("dialog");

    expect(field("Phone")).toHaveValue("555-0100");
    expect(
      screen.queryByText("Failed to update the current user"),
    ).not.toBeInTheDocument();
  });

  it("locks the form and shows progress while saving", async () => {
    updateUser.mockReturnValue(new Promise(() => {}));
    renderWithStore(<EditProfile user={user} />);
    openDialog();
    await screen.findByRole("dialog");

    fireEvent.change(field("Phone"), { target: { value: "555-0199" } });
    fireEvent.click(save());

    const busy = await screen.findByRole("button", { name: /Saving changes/ });
    expect(busy).toBeDisabled();
    expect(field("Full name")).toBeDisabled();
    expect(field("Email")).toBeDisabled();
    expect(field("Phone")).toBeDisabled();
    expect(field("Profile image")).toBeDisabled();
    expect(screen.queryByText("No changes to save")).not.toBeInTheDocument();
  });

  it("has no axe violations while open", async () => {
    renderWithStore(<EditProfile user={user} />);
    openDialog();
    await screen.findByRole("dialog");

    await expectNoA11yViolations(screen.getByRole("dialog"));
  });
});

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "@/test/axe";
import { makeSession } from "@/test/fixtures";
import { renderWithStore } from "@/test/render-with-store";
import { SessionsList } from "./SessionsList";

const sessions = vi.hoisted(() => vi.fn());
const sessionRevoke = vi.hoisted(() => vi.fn());
const sessionRevokeOthers = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({
  authApi: { sessions, sessionRevoke, sessionRevokeOthers },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const current = makeSession({ sessionId: "s-current", isCurrent: true });
const other = makeSession({
  sessionId: "s-other",
  os: "macOS",
  browser: "Safari",
});

const revokeOthersButton = () =>
  screen.getByRole("button", { name: /Sign out all other sessions/ });

async function renderList(list = [current, other]) {
  sessions.mockResolvedValue(list);
  const view = renderWithStore(<SessionsList />);
  await waitFor(() =>
    expect(view.store.getState().auth.isSessionsLoading).toBe(false),
  );
  return view;
}

describe("SessionsList", () => {
  beforeEach(() => {
    sessions.mockReset();
    sessionRevoke.mockReset();
    sessionRevokeOthers.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  describe("listing", () => {
    it("loads the sessions when it appears", async () => {
      await renderList();

      expect(sessions).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Windows/Chrome")).toBeInTheDocument();
      expect(screen.getByText("macOS/Safari")).toBeInTheDocument();
    });

    it("shows a loading indicator while the sessions are loading", () => {
      sessions.mockReturnValue(new Promise(() => {}));

      renderWithStore(<SessionsList />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Windows/Chrome")).not.toBeInTheDocument();
    });

    it("counts the devices, in the plural", async () => {
      await renderList();

      expect(screen.getByText("2 devices signed in")).toBeInTheDocument();
    });

    it("counts a single device in the singular", async () => {
      await renderList([current]);

      expect(screen.getByText("1 device signed in")).toBeInTheDocument();
    });

    it("counts no devices in the plural", async () => {
      await renderList([]);

      expect(screen.getByText("0 devices signed in")).toBeInTheDocument();
    });

    it("marks the current device and does not let the user revoke it", async () => {
      await renderList([current]);

      expect(screen.getByText("This device")).toBeInTheDocument();
      expect(screen.getByText("Active now")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Revoke" }),
      ).not.toBeInTheDocument();
    });

    it("shows when another device was last active and offers to revoke it", async () => {
      await renderList([other]);

      expect(screen.getByText(/ago$/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Revoke" }),
      ).toBeInTheDocument();
    });

    it("separates every session but the last with a rule", async () => {
      await renderList([current, other]);

      const rows = screen
        .getAllByText(/\//)
        .map((label) => label.parentElement!.parentElement!);
      expect(rows[0]).toHaveClass("border-b");
      expect(rows[1]).not.toHaveClass("border-b");
    });
  });

  describe("revoking one session", () => {
    const openRevoke = async () => {
      await renderList();
      fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
      return screen.findByRole("dialog", { name: "Revoke session" });
    };
    const confirm = (dialog: HTMLElement) =>
      within(dialog).getByRole("button", { name: /Confirm|Revoking/ });

    it("asks for confirmation first", async () => {
      const dialog = await openRevoke();

      expect(
        within(dialog).getByText("Do you want to revoke this session?"),
      ).toBeInTheDocument();
      expect(sessionRevoke).not.toHaveBeenCalled();
    });

    it("closes without revoking on cancel", async () => {
      const dialog = await openRevoke();

      fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(sessionRevoke).not.toHaveBeenCalled();
    });

    it("closes without revoking when dismissed", async () => {
      const dialog = await openRevoke();

      fireEvent.keyDown(dialog, { key: "Escape" });

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(sessionRevoke).not.toHaveBeenCalled();
    });

    it("revokes the session, confirms it, refreshes the list and closes", async () => {
      sessionRevoke.mockResolvedValue({ success: true, message: "ok" });
      const dialog = await openRevoke();

      fireEvent.click(confirm(dialog));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(sessionRevoke).toHaveBeenCalledWith({ sessionId: "s-other" });
      expect(toast.success).toHaveBeenCalledWith("Session revoked");
      await waitFor(() => expect(sessions).toHaveBeenCalledTimes(2));
    });

    it("keeps the dialog open so the user can retry when revoking fails", async () => {
      sessionRevoke.mockRejectedValue(new Error("network down"));
      const dialog = await openRevoke();

      fireEvent.click(confirm(dialog));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to revoke the session",
        ),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(confirm(dialog)).toBeEnabled();
    });

    it("falls back to a generic message when the failure is not a string", async () => {
      renderWithStore(<SessionsList />, {
        auth: { sessions: [current, other] },
        dispatchOutcome: [{ resolves: {} }, { rejects: new Error("boom") }],
      });
      fireEvent.click(await screen.findByRole("button", { name: "Revoke" }));
      const dialog = await screen.findByRole("dialog");

      fireEvent.click(confirm(dialog));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to revoke the session",
        ),
      );
    });

    it("does nothing visible when the server does not report success", async () => {
      sessionRevoke.mockResolvedValue({ success: false, message: "no" });
      const dialog = await openRevoke();

      fireEvent.click(confirm(dialog));

      await waitFor(() => expect(sessionRevoke).toHaveBeenCalled());
      expect(toast.success).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("cannot be dismissed while the revoke is in flight", async () => {
      sessionRevoke.mockReturnValue(new Promise(() => {}));
      const dialog = await openRevoke();

      fireEvent.click(confirm(dialog));
      await screen.findByRole("button", { name: /Revoking/ });
      fireEvent.keyDown(dialog, { key: "Escape" });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Cancel" }),
      ).toBeDisabled();
    });
  });

  describe("signing out the other sessions", () => {
    it("signs them out, confirms it and refreshes the list", async () => {
      sessionRevokeOthers.mockResolvedValue({ success: true, message: "ok" });
      await renderList();

      fireEvent.click(revokeOthersButton());

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Other sessions signed out"),
      );
      await waitFor(() => expect(sessions).toHaveBeenCalledTimes(2));
    });

    it("tells the user when signing out fails", async () => {
      sessionRevokeOthers.mockRejectedValue(new Error("network down"));
      await renderList();

      fireEvent.click(revokeOthersButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to sign out other sessions",
        ),
      );
    });

    it("falls back to a generic message when the failure is not a string", async () => {
      renderWithStore(<SessionsList />, {
        dispatchOutcome: [
          { resolves: [current] },
          { rejects: new Error("boom") },
        ],
      });
      fireEvent.click(
        await screen.findByRole("button", {
          name: /Sign out all other sessions/,
        }),
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to sign out other sessions",
        ),
      );
    });

    it("says nothing when the server does not report success", async () => {
      sessionRevokeOthers.mockResolvedValue({ success: false, message: "no" });
      await renderList();

      fireEvent.click(revokeOthersButton());

      await waitFor(() => expect(sessionRevokeOthers).toHaveBeenCalled());
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("shows progress while signing out", async () => {
      sessionRevokeOthers.mockReturnValue(new Promise(() => {}));
      await renderList();

      fireEvent.click(revokeOthersButton());

      expect(
        await screen.findByRole("button", { name: /Signing out/ }),
      ).toBeDisabled();
    });
  });

  it("has no axe violations with sessions and with the revoke dialog open", async () => {
    const { container } = await renderList();
    await expectNoA11yViolations(container);

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    await expectNoA11yViolations(await screen.findByRole("dialog"));
  });
});

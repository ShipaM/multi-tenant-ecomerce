import { fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "@/test/axe";
import { makeUser } from "@/test/fixtures";
import { renderWithStore } from "@/test/render-with-store";
import { TwoFactorAuthentication } from "./TwoFactorAuthentication";

const twoFactorGenerateOtp = vi.hoisted(() => vi.fn());
const verifyEnableDisableTwoFactor = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({
  authApi: { twoFactorGenerateOtp, verifyEnableDisableTwoFactor },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const user = makeUser({ twoFactorEnabled: false });

const trigger = (name: "Enable" | "Disable" = "Enable") =>
  screen.getByRole("button", { name });
const sendOtp = () => screen.getByRole("button", { name: /Send OTP/ });
const verifyButton = () => screen.getByRole("button", { name: /Verify OTP/ });
const codeInput = () => screen.getByLabelText("OTP");

const openDialog = async (name: "Enable" | "Disable" = "Enable") => {
  fireEvent.click(trigger(name));
  await screen.findByRole("dialog");
};

const reachOtpStep = async () => {
  twoFactorGenerateOtp.mockResolvedValue({
    success: true,
    message: "OTP sent",
  });
  await openDialog();
  fireEvent.click(sendOtp());
  await screen.findByRole("heading", { name: "OTP 2FA" });
};

describe("TwoFactorAuthentication", () => {
  beforeEach(() => {
    twoFactorGenerateOtp.mockReset();
    verifyEnableDisableTwoFactor.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  describe("trigger", () => {
    it("offers to enable two-factor authentication when it is off", () => {
      renderWithStore(<TwoFactorAuthentication user={user} />);

      expect(trigger("Enable")).toBeInTheDocument();
    });

    it("offers to disable it when it is on", () => {
      renderWithStore(
        <TwoFactorAuthentication user={{ ...user, twoFactorEnabled: true }} />,
      );

      expect(trigger("Disable")).toBeInTheDocument();
    });

    it("starts closed", () => {
      renderWithStore(<TwoFactorAuthentication user={user} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("requesting a code", () => {
    it("shows the account email read-only", async () => {
      renderWithStore(<TwoFactorAuthentication user={user} />);

      await openDialog();

      const email = screen.getByLabelText("Email");
      expect(email).toHaveValue("jane@example.com");
      expect(email).toHaveAttribute("readonly");
      expect(
        screen.getByRole("heading", { name: "Two Factor Authentication" }),
      ).toBeInTheDocument();
    });

    it("sends a code, confirms it and moves to the code step", async () => {
      twoFactorGenerateOtp.mockResolvedValue({
        success: true,
        message: "OTP sent",
      });
      renderWithStore(<TwoFactorAuthentication user={user} />);
      await openDialog();

      fireEvent.click(sendOtp());

      expect(
        await screen.findByRole("heading", { name: "OTP 2FA" }),
      ).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith("OTP sent");
    });

    it("shows the error and stays on the first step when sending fails", async () => {
      twoFactorGenerateOtp.mockRejectedValue(new Error("network down"));
      renderWithStore(<TwoFactorAuthentication user={user} />);
      await openDialog();

      fireEvent.click(sendOtp());

      expect(
        await screen.findByText("Failed to generate otp"),
      ).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Failed to generate otp");
      expect(
        screen.getByRole("heading", { name: "Two Factor Authentication" }),
      ).toBeInTheDocument();
    });

    it("falls back to a generic message when the failure is not a string", async () => {
      renderWithStore(<TwoFactorAuthentication user={user} />, {
        dispatchOutcome: { rejects: new Error("boom") },
      });
      await openDialog();

      fireEvent.click(sendOtp());

      expect(await screen.findByText("Failed to send otp")).toBeInTheDocument();
    });

    it("shows progress while the code is being sent", async () => {
      twoFactorGenerateOtp.mockReturnValue(new Promise(() => {}));
      renderWithStore(<TwoFactorAuthentication user={user} />);
      await openDialog();

      fireEvent.click(sendOtp());

      expect(
        await screen.findByRole("button", { name: /Sending otp/ }),
      ).toBeDisabled();
    });
  });

  describe("verifying the code", () => {
    it("verifies the code, confirms it and closes the dialog", async () => {
      verifyEnableDisableTwoFactor.mockResolvedValue({
        success: true,
        message: "2FA enabled",
        data: { twoFactorEnabled: true },
      });
      renderWithStore(<TwoFactorAuthentication user={user} />);
      await reachOtpStep();

      fireEvent.change(codeInput(), { target: { value: "123456" } });
      fireEvent.click(verifyButton());

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(verifyEnableDisableTwoFactor).toHaveBeenCalledWith({
        otp: "123456",
      });
      expect(toast.success).toHaveBeenCalledWith("2FA enabled");
    });

    it("tells the user with a toast and stays on the code step when verification fails", async () => {
      verifyEnableDisableTwoFactor.mockRejectedValue(new Error("network down"));
      renderWithStore(<TwoFactorAuthentication user={user} />);
      await reachOtpStep();

      fireEvent.change(codeInput(), { target: { value: "123456" } });
      fireEvent.click(verifyButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Failed to verify otp"),
      );
      expect(
        screen.getByRole("heading", { name: "OTP 2FA" }),
      ).toBeInTheDocument();
    });

    it("falls back to a generic message when the failure is not a string", async () => {
      renderWithStore(<TwoFactorAuthentication user={user} />, {
        dispatchOutcome: [
          { resolves: { message: "OTP sent" } },
          { rejects: new Error("boom") },
        ],
      });
      await openDialog();
      fireEvent.click(sendOtp());
      await screen.findByRole("heading", { name: "OTP 2FA" });

      fireEvent.change(codeInput(), { target: { value: "123456" } });
      fireEvent.click(verifyButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Failed to send otp"),
      );
    });

    it("shows progress and locks the code field while verifying", async () => {
      verifyEnableDisableTwoFactor.mockReturnValue(new Promise(() => {}));
      renderWithStore(<TwoFactorAuthentication user={user} />);
      await reachOtpStep();

      fireEvent.change(codeInput(), { target: { value: "123456" } });
      fireEvent.click(verifyButton());

      expect(
        await screen.findByRole("button", { name: /Verifying otp/ }),
      ).toBeDisabled();
      expect(codeInput()).toBeDisabled();
    });
  });

  it("starts from the first step every time it is opened", async () => {
    renderWithStore(<TwoFactorAuthentication user={user} />);
    await reachOtpStep();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await openDialog();

    expect(
      screen.getByRole("heading", { name: "Two Factor Authentication" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations on either step", async () => {
    renderWithStore(<TwoFactorAuthentication user={user} />);
    await openDialog();
    await expectNoA11yViolations(screen.getByRole("dialog"));

    twoFactorGenerateOtp.mockResolvedValue({ success: true, message: "sent" });
    fireEvent.click(sendOtp());
    await screen.findByRole("heading", { name: "OTP 2FA" });
    await expectNoA11yViolations(screen.getByRole("dialog"));
  });
});

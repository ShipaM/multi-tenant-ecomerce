import { beforeEach, describe, vi } from "vitest";

import {
  fetchForgotPassword,
  fetchForgotPasswordOtpVerify,
  resetForgottenPassword,
} from "./forgotPassword.thunks";
import { itBehavesLikeSimpleThunk } from "./thunk-test-utils";

const api = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
  forgotPasswordOtpVerify: vi.fn(),
  resetForgottenPassword: vi.fn(),
}));

vi.mock("@/api/auth", () => ({ authApi: api }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("fetchForgotPassword", () => {
  const payload = { email: "jane@example.com" };

  itBehavesLikeSimpleThunk({
    api: api.forgotPassword,
    run: (store) => store.dispatch(fetchForgotPassword(payload as never)),
    expectedArgs: [payload],
    data: { message: "sent" },
    fallback: "Failed to send forgot password email",
  });
});

describe("fetchForgotPasswordOtpVerify", () => {
  const payload = { email: "jane@example.com", otp: "123456" };

  itBehavesLikeSimpleThunk({
    api: api.forgotPasswordOtpVerify,
    run: (store) =>
      store.dispatch(fetchForgotPasswordOtpVerify(payload as never)),
    expectedArgs: [payload],
    data: { message: "verified", resetToken: "tok" },
    fallback: "Failed to verify forgot password otp",
  });
});

describe("resetForgottenPassword", () => {
  const payload = { resetToken: "tok", password: "new-password" };

  itBehavesLikeSimpleThunk({
    api: api.resetForgottenPassword,
    run: (store) => store.dispatch(resetForgottenPassword(payload as never)),
    expectedArgs: [payload],
    data: { message: "reset" },
    fallback: "Failed to reset password",
  });
});

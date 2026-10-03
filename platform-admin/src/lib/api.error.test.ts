import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { getAxiosErrorMessage } from "./api.error";

const axiosErrorWith = (data: unknown) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: {} as never,
  });

describe("getAxiosErrorMessage", () => {
  it("returns the message string from the response body", () => {
    expect(
      getAxiosErrorMessage(axiosErrorWith({ message: "Invalid code" }), "x"),
    ).toBe("Invalid code");
  });

  it("returns the first message when the server sends a list", () => {
    expect(
      getAxiosErrorMessage(
        axiosErrorWith({ message: ["First", "Second"] }),
        "x",
      ),
    ).toBe("First");
  });

  it("falls back to the default when the list is empty", () => {
    expect(
      getAxiosErrorMessage(axiosErrorWith({ message: [] }), "Default"),
    ).toBe("Default");
  });

  it("falls back to the default when the body has no usable message", () => {
    expect(getAxiosErrorMessage(axiosErrorWith({}), "Default")).toBe("Default");
    expect(
      getAxiosErrorMessage(axiosErrorWith({ message: 42 }), "Default"),
    ).toBe("Default");
  });

  it("falls back to the default when there is no response", () => {
    expect(
      getAxiosErrorMessage(new AxiosError("Network Error"), "Default"),
    ).toBe("Default");
  });

  it("falls back to the default for errors that did not come from axios", () => {
    expect(getAxiosErrorMessage(new Error("boom"), "Default")).toBe("Default");
    expect(getAxiosErrorMessage("boom", "Default")).toBe("Default");
  });
});

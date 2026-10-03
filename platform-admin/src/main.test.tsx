import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/App", () => ({ default: () => <div>App content</div> }));
vi.mock("sonner", () => ({ Toaster: () => <div>Toaster</div> }));

describe("main", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("mounts the app and the toaster into #root", async () => {
    await import("./main");

    await waitFor(() => {
      expect(document.getElementById("root")).toHaveTextContent("App content");
    });
    expect(document.getElementById("root")).toHaveTextContent("Toaster");
  });
});

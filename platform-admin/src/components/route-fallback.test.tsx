import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteFallback } from "./route-fallback";

describe("RouteFallback", () => {
  it("renders a loading spinner", () => {
    render(<RouteFallback />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("uses a section-sized container by default", () => {
    render(<RouteFallback />);

    expect(screen.getByRole("status").parentElement).toHaveClass("min-h-64");
  });

  it("fills the viewport when fullscreen is requested", () => {
    render(<RouteFallback fullscreen />);

    expect(screen.getByRole("status").parentElement).toHaveClass("min-h-svh");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollToTop } from "./ScrollToTop";

function Harness() {
  const navigate = useNavigate();
  return (
    <>
      <ScrollToTop />
      <button onClick={() => navigate("/b")}>Go to b</button>
      <button onClick={() => navigate(-1)}>Go back</button>
      <Routes>
        <Route path="/a" element={<div>Page a</div>} />
        <Route path="/b" element={<div>Page b</div>} />
      </Routes>
    </>
  );
}

describe("ScrollToTop", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("does not scroll on the initial render", () => {
    render(
      <MemoryRouter initialEntries={["/a"]} useTransitions={false}>
        <Harness />
      </MemoryRouter>,
    );

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the top after navigating to a new route", () => {
    render(
      <MemoryRouter initialEntries={["/a"]} useTransitions={false}>
        <Harness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to b" }));

    expect(screen.getByText("Page b")).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("does not scroll again when the user navigates back", () => {
    render(
      <MemoryRouter initialEntries={["/a"]} useTransitions={false}>
        <Harness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to b" }));
    expect(window.scrollTo).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(screen.getByText("Page a")).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });
});

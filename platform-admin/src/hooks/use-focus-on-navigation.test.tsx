import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { describe, expect, it } from "vitest";

import { useFocusOnNavigation } from "./use-focus-on-navigation";

function Shell() {
  const ref = useFocusOnNavigation<HTMLElement>();
  const navigate = useNavigate();

  return (
    <>
      <button onClick={() => navigate("/next")}>Go</button>
      <button onClick={() => navigate("/start?tab=2")}>Same page</button>
      <main ref={ref} tabIndex={-1} aria-label="content" />
    </>
  );
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/start"]} useTransitions={false}>
      <Routes>
        <Route path="*" element={<Shell />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("useFocusOnNavigation", () => {
  it("leaves focus alone on the first render", () => {
    renderShell();

    expect(screen.getByRole("main")).not.toHaveFocus();
  });

  it("moves focus to the element after navigating to another path", () => {
    renderShell();

    screen.getByRole("button", { name: "Go" }).click();

    return screen.findByRole("main").then((main) => {
      expect(main).toHaveFocus();
    });
  });

  it("does not steal focus when only the query string changes", () => {
    renderShell();
    const link = screen.getByRole("button", { name: "Same page" });
    link.focus();

    link.click();

    expect(screen.getByRole("main")).not.toHaveFocus();
  });
});

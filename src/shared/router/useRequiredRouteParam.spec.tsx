import type { PropsWithChildren } from "react";

import { renderHook } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { useRequiredRouteParam } from "./useRequiredRouteParam";

const Router = ({ children, path, route }: PropsWithChildren<{ path: string; route: string }>) => (
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route path={path} element={children} />
    </Routes>
  </MemoryRouter>
);

describe("useRequiredRouteParam", () => {
  it("returns the requested route parameter", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <Router path="/cards/:id" route="/cards/card-id">
        {children}
      </Router>
    );

    expect(renderHook(() => useRequiredRouteParam("id"), { wrapper }).result.current).toBe("card-id");
  });

  it("rejects a route without the requested parameter", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <Router path="/cards" route="/cards">
        {children}
      </Router>
    );

    expect(() => renderHook(() => useRequiredRouteParam("id"), { wrapper })).toThrowError(
      "Missing route parameter: id"
    );
  });
});

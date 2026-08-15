import type { PropsWithChildren } from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteParamTestRouter } from "./RouteParamTestRouter";
import { useRequiredRouteParam } from "./useRequiredRouteParam";

describe("useRequiredRouteParam", () => {
  it("returns the requested route parameter", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <RouteParamTestRouter path="/cards/:id" route="/cards/card-id">
        {children}
      </RouteParamTestRouter>
    );

    expect(renderHook(() => useRequiredRouteParam("id"), { wrapper }).result.current).toBe("card-id");
  });

  it("rejects a route without the requested parameter", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <RouteParamTestRouter path="/cards" route="/cards">
        {children}
      </RouteParamTestRouter>
    );

    expect(() => renderHook(() => useRequiredRouteParam("id"), { wrapper })).toThrowError(
      "Missing route parameter: id"
    );
  });
});

import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { Header } from "@/shared/components/layout/Header";

afterEach(cleanup);

describe("Header", () => {
  it("renders an elevated safe-area-aware fixed shell with touch-sized SVG actions", () => {
    const view = render(<Header fixed />);
    const logo = view.getByText("tango").closest("div");
    const header = logo?.parentElement;
    const actions = view.container.querySelectorAll("svg");

    expect(logo).not.toBeNull();
    expect(header).not.toBeNull();
    expect(header).toHaveClass(
      "fixed",
      "inset-x-0",
      "top-0",
      "z-50",
      "bg-surface-elevated",
      "text-ink",
      "shadow-elevated",
      "pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))]",
      "pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))]",
      "pt-[calc(0.5rem+env(safe-area-inset-top))]"
    );
    expect(actions).toHaveLength(3);
    for (const action of actions) expect(action).toHaveClass("size-touch");
  });

  it("preserves action order and callback payloads for light and dark modes", () => {
    const events: string[] = [];
    const view = render(
      <Header
        onClickLogo={() => events.push("logo")}
        onClickDarkMode={(dark) => events.push(`dark:${dark}`)}
        onClickMenuItem={(key) => events.push(`menu:${key}`)}
      />
    );

    fireEvent.click(view.getByRole("button", { name: "tango" }));
    const lightModeActions = view.container.querySelectorAll("svg");
    fireEvent.click(lightModeActions[0] as SVGElement);
    fireEvent.click(lightModeActions[1] as SVGElement);
    fireEvent.click(lightModeActions[2] as SVGElement);

    expect(events).toEqual(["logo", "dark:true", "menu:upload", "menu:config"]);

    view.rerender(
      <Header
        dark
        onClickDarkMode={(dark) => events.push(`dark:${dark}`)}
        onClickMenuItem={(key) => events.push(`menu:${key}`)}
      />
    );
    fireEvent.click(view.container.querySelectorAll("svg")[0] as SVGElement);

    expect(events).toEqual(["logo", "dark:true", "menu:upload", "menu:config", "dark:false"]);
  });

  it("retains clickable SVG actions without changing their selector contract", () => {
    const view = render(<Header onClickDarkMode={() => undefined} onClickMenuItem={() => undefined} />);
    const actions = view.container.querySelectorAll("svg");

    expect(actions).toHaveLength(3);
    expect(view.queryByRole("button")).not.toBeInTheDocument();
  });
});

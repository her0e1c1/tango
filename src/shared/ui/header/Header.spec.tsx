/** @file Verifies Header content and user actions through its accessible interface. */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Header } from "./Header";

describe("Header", () => {
  it("renders the logo in the application banner", () => {
    render(<Header />);

    expect(screen.getByRole("banner")).toContainElement(screen.getByText("tango"));
  });

  it("preserves action callbacks and dark-mode payloads", () => {
    const events: string[] = [];
    const view = render(
      <Header
        onClickLogo={() => events.push("logo")}
        onClickDarkMode={(dark) => events.push(`dark:${dark}`)}
        onClickImport={() => events.push("import")}
        onClickAccount={() => events.push("account")}
        onClickSettings={() => events.push("settings")}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "tango" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Import decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Open account" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(events).toEqual(["logo", "dark:true", "import", "account", "settings"]);

    view.rerender(<Header dark onClickDarkMode={(dark) => events.push(`dark:${dark}`)} />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(events).toEqual(["logo", "dark:true", "import", "account", "settings", "dark:false"]);
  });

  it("uses prepared localized labels without changing action behavior", () => {
    render(
      <Header
        labels={{
          switchToDarkMode: "ダークモードに切り替え",
          importDecks: "デッキをインポート",
          openAccount: "アカウントを開く",
          openSettings: "設定を開く",
        }}
      />
    );

    expect(screen.getByRole("button", { name: "ダークモードに切り替え" })).toBeVisible();
    expect(screen.getByRole("button", { name: "デッキをインポート" })).toBeVisible();
    expect(screen.getByRole("button", { name: "アカウントを開く" })).toBeVisible();
    expect(screen.getByRole("button", { name: "設定を開く" })).toBeVisible();
  });
});

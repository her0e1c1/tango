/**
 * @file Verifies the "ConfigForm" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "groups every auto-saved
 * setting in the unified settings list", "preserves all switch, slider, and metadata values",
 * "forwards switch and slider changes to their field callbacks".
 */

import type React from "react";

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ConfigForm, type ConfigFormProps } from "./ConfigForm";
import { createConfig } from "@/test/factories";

type ConfigFormFields = React.ComponentProps<typeof ConfigForm>["fields"];

/**
 * Provides the create fields test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function createFields(): ConfigFormFields {
  return {
    showHeader: { name: "showHeader", checked: true, onChange: vi.fn() },
    showSwipeButtonList: { name: "showSwipeButtonList", checked: false, onChange: vi.fn() },
    showSwipeFeedback: { name: "showSwipeFeedback", checked: true, onChange: vi.fn() },
    darkMode: { name: "darkMode", checked: false, onChange: vi.fn() },
    shuffled: { name: "shuffled", checked: false, onChange: vi.fn() },
    useCardInterval: { name: "useCardInterval", checked: true, onChange: vi.fn() },
    maxNumberOfCardsToLearn: { name: "maxNumberOfCardsToLearn", value: "24", min: 1, max: 100, onChange: vi.fn() },
    defaultAutoPlay: { name: "defaultAutoPlay", checked: false, onChange: vi.fn() },
    cardInterval: { name: "cardInterval", value: "7", min: 1, max: 60, onChange: vi.fn() },
  };
}

/**
 * Provides the create props test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function createProps(overrides: Partial<ConfigFormProps> = {}): ConfigFormProps {
  return {
    config: createConfig(),
    fields: createFields(),
    maxNumberOfCardsToLearn: 24,
    cardInterval: 7,
    version: "1.2.3",
    ...overrides,
  };
}

describe("ConfigForm", () => {
  it("groups every auto-saved setting in the unified settings list", () => {
    render(<ConfigForm {...createProps()} />);

    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    for (const name of ["Account", "Appearance", "Study"]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("group", { name: "Advanced" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Layout" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Autoplay" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Metadata" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Account" })).toHaveClass("rounded-surface", "border", "bg-surface");
    expect(screen.getByText("Show header")).toBeInTheDocument();
    expect(screen.queryByText("Show Heaer")).not.toBeInTheDocument();
  });

  it("preserves all switch, slider, and metadata values", () => {
    render(
      <ConfigForm {...createProps({ identity: { uid: "user-123", displayName: "Settings User" }, isLoggedIn: true })} />
    );

    expect(screen.getAllByRole("checkbox")).toHaveLength(7);
    expect(screen.getByRole("checkbox", { name: "Show header" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Respect review schedule" })).toBeChecked();
    expect(screen.getByRole("slider", { name: "Maximum cards" })).toHaveValue("24");
    expect(screen.getByRole("slider", { name: "Autoplay interval" })).toHaveValue("7");
    expect(screen.getByRole("slider", { name: "Autoplay interval" })).toHaveAttribute("aria-valuetext", "7 seconds");
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("7s")).toBeInTheDocument();

    const details = screen.getByRole("group", { name: "Advanced" });
    expect(details).not.toHaveAttribute("open");
    expect(details).not.toHaveTextContent("Github Access Token");
    expect(details).toHaveTextContent("1.2.3");
    expect(details).toHaveTextContent("user-123");
  });

  it("describes review scheduling independently from autoplay", () => {
    render(<ConfigForm {...createProps()} />);

    expect(screen.getByRole("checkbox", { name: "Respect review schedule" })).toBeChecked();
    expect(screen.getByText("Hide cards until their next review time")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Autoplay interval" })).toBeInTheDocument();
    expect(screen.queryByText("Wait between automatic card changes")).not.toBeInTheDocument();
  });

  it("forwards switch and slider changes to their field callbacks", async () => {
    let switchArguments: { name: string; checked: boolean } | undefined;
    let sliderArguments: { name: string; value: string } | undefined;
    const showHeader = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      switchArguments = { name: event.target.name, checked: event.target.checked };
    });
    const maxNumberOfCardsToLearn = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      sliderArguments = { name: event.target.name, value: event.target.value };
    });
    const fields = createFields();
    fields.showHeader.onChange = showHeader;
    fields.maxNumberOfCardsToLearn.onChange = maxNumberOfCardsToLearn;
    render(<ConfigForm {...createProps({ fields })} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Show header" }));
    fireEvent.change(screen.getByRole("slider", { name: "Maximum cards" }), {
      target: { value: "31" },
    });

    expect(showHeader).toHaveBeenCalledOnce();
    expect(switchArguments).toEqual({ name: "showHeader", checked: false });
    expect(maxNumberOfCardsToLearn).toHaveBeenCalledOnce();
    expect(sliderArguments).toEqual({ name: "maxNumberOfCardsToLearn", value: "31" });
  });

  it("keeps section heading relationships unique across multiple instances", () => {
    render(
      <>
        <ConfigForm {...createProps()} />
        <ConfigForm {...createProps()} />
      </>
    );
    for (const name of ["Account", "Appearance", "Study"]) {
      expect(screen.getAllByRole("region", { name })).toHaveLength(2);
      expect(screen.getAllByRole("heading", { level: 2, name })).toHaveLength(2);
    }
    expect(screen.getAllByRole("group", { name: "Advanced" })).toHaveLength(2);
  });

  it("preserves logged-out login and logged-in logout behavior", async () => {
    const onLogin = vi.fn();
    const onLogout = vi.fn();
    const view = render(<ConfigForm {...createProps({ onLogin })} />);

    expect(screen.getByText("Google Login")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(onLogin).toHaveBeenCalledOnce();

    view.rerender(
      <ConfigForm
        {...createProps({
          isLoggedIn: true,
          identity: { uid: "user-123", displayName: "Settings User" },
          onLogout,
        })}
      />
    );
    expect(screen.getByText("Settings User")).toBeInTheDocument();
    expect(screen.getByText("Signed in with Google")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("shows account feedback and disables the active account action while pending", () => {
    const feedback = <p>Signing in…</p>;
    const view = render(<ConfigForm {...createProps({ accountPending: true, accountFeedback: feedback })} />);

    const login = screen.getByRole("button", { name: "Login" });
    expect(login).toBeDisabled();
    expect(login).toHaveAttribute("aria-busy", "true");
    expect(within(screen.getByRole("region", { name: "Account" })).getByText("Signing in…")).toBeVisible();

    view.rerender(
      <ConfigForm
        {...createProps({
          isLoggedIn: true,
          identity: { uid: "user-123", displayName: "Settings User" },
          accountPending: true,
        })}
      />
    );

    const logout = screen.getByRole("button", { name: "Logout" });
    expect(logout).toBeDisabled();
    expect(logout).toHaveAttribute("aria-busy", "true");
  });
});

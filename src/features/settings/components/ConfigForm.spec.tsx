import type React from "react";

import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ConfigForm, type ConfigFormFields, type ConfigFormProps } from "@/features/settings/components/ConfigForm";
import { createConfig } from "@/test/factories";

function createFields(): ConfigFormFields {
  return {
    showHeader: { name: "showHeader", checked: true, onChange: vi.fn() },
    showSwipeButtonList: { name: "showSwipeButtonList", checked: false, onChange: vi.fn() },
    showSwipeFeedback: { name: "showSwipeFeedback", checked: true, onChange: vi.fn() },
    darkMode: { name: "darkMode", checked: false, onChange: vi.fn() },
    localMode: { name: "localMode", checked: true, onChange: vi.fn() },
    shuffled: { name: "shuffled", checked: false, onChange: vi.fn() },
    useCardInterval: { name: "useCardInterval", checked: true, onChange: vi.fn() },
    maxNumberOfCardsToLearn: { name: "maxNumberOfCardsToLearn", value: "24", min: 1, max: 100, onChange: vi.fn() },
    defaultAutoPlay: { name: "defaultAutoPlay", checked: false, onChange: vi.fn() },
    cardInterval: { name: "cardInterval", value: "7", min: 1, max: 60, onChange: vi.fn() },
    githubAccessToken: { name: "githubAccessToken", value: "github-token", onChange: vi.fn() },
  };
}

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
  afterEach(cleanup);

  it("groups every auto-saved setting in semantic Calm Focus sections", () => {
    const view = render(<ConfigForm {...createProps()} />);

    expect(view.container.querySelector("form")).not.toBeInTheDocument();
    for (const name of ["Account", "Layout", "Study", "Autoplay", "Metadata"]) {
      const heading = view.getByRole("heading", { level: 2, name });
      expect(heading.closest("section")).toHaveAttribute("aria-labelledby", heading.id);
    }
    expect(view.getByRole("heading", { level: 2, name: "Account" }).closest("section")).toHaveClass(
      "rounded-surface",
      "border",
      "border-border",
      "bg-surface-muted",
      "p-4"
    );
    expect(view.getByText("Show Header")).toBeInTheDocument();
    expect(view.queryByText("Show Heaer")).not.toBeInTheDocument();
  });

  it("preserves all switch, slider, token, and metadata values", () => {
    const view = render(
      <ConfigForm {...createProps({ identity: { uid: "user-123", displayName: "Settings User" }, isLoggedIn: true })} />
    );

    expect(view.container.querySelectorAll("input[type='checkbox']")).toHaveLength(8);
    expect(view.container.querySelector("input[name='showHeader']")).toBeChecked();
    expect(view.container.querySelector("input[name='localMode']")).toBeChecked();
    expect(view.container.querySelector("input[name='useCardInterval']")).toBeChecked();
    expect(view.container.querySelector("input[name='maxNumberOfCardsToLearn']")).toHaveValue("24");
    expect(view.container.querySelector("input[name='cardInterval']")).toHaveValue("7");
    expect(view.container.querySelector("input[name='githubAccessToken']")).toHaveValue("github-token");
    expect(view.getByText("Max number of cards to learn: 24")).toBeInTheDocument();
    expect(view.getByText("Interval: 7 sec")).toBeInTheDocument();
    expect(view.getByText("1.2.3")).toBeInTheDocument();
    expect(view.getByText("user-123")).toBeInTheDocument();
  });

  it("forwards switch, slider, and token changes to their field callbacks", async () => {
    let switchArguments: { name: string; checked: boolean } | undefined;
    let sliderArguments: { name: string; value: string } | undefined;
    let tokenArguments: { name: string; value: string } | undefined;
    const showHeader = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      switchArguments = { name: event.target.name, checked: event.target.checked };
    });
    const maxNumberOfCardsToLearn = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      sliderArguments = { name: event.target.name, value: event.target.value };
    });
    const githubAccessToken = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      tokenArguments = { name: event.target.name, value: event.target.value };
    });
    const fields = createFields();
    fields.showHeader.onChange = showHeader;
    fields.maxNumberOfCardsToLearn.onChange = maxNumberOfCardsToLearn;
    fields.githubAccessToken.onChange = githubAccessToken;
    const view = render(<ConfigForm {...createProps({ fields })} />);

    await userEvent.click(view.container.querySelector("input[name='showHeader']") as HTMLInputElement);
    fireEvent.change(view.container.querySelector("input[name='maxNumberOfCardsToLearn']") as HTMLInputElement, {
      target: { value: "31" },
    });
    fireEvent.change(view.container.querySelector("input[name='githubAccessToken']") as HTMLInputElement, {
      target: { value: "updated-token" },
    });

    expect(showHeader).toHaveBeenCalledOnce();
    expect(switchArguments).toEqual({ name: "showHeader", checked: false });
    expect(maxNumberOfCardsToLearn).toHaveBeenCalledOnce();
    expect(sliderArguments).toEqual({ name: "maxNumberOfCardsToLearn", value: "31" });
    expect(githubAccessToken).toHaveBeenCalledOnce();
    expect(tokenArguments).toEqual({ name: "githubAccessToken", value: "updated-token" });
  });

  it("keeps section heading relationships unique across multiple instances", () => {
    const view = render(
      <>
        <ConfigForm {...createProps()} />
        <ConfigForm {...createProps()} />
      </>
    );
    const headings = view.getAllByRole("heading", { level: 2 });
    const headingIds = headings.map((heading) => heading.id);

    expect(headings).toHaveLength(10);
    expect(new Set(headingIds).size).toBe(10);
    for (const heading of headings) {
      expect(heading.closest("section")).toHaveAttribute("aria-labelledby", heading.id);
      expect(document.getElementById(heading.id)).toBe(heading);
    }
  });

  it("preserves logged-out login and logged-in logout behavior", async () => {
    const onLogin = vi.fn();
    const onLogout = vi.fn();
    const view = render(<ConfigForm {...createProps({ onLogin })} />);

    expect(view.getByText("Google Login")).toBeInTheDocument();
    await userEvent.click(view.getByRole("button", { name: "Login" }));
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
    expect(view.getByText("Logged In As Settings User")).toBeInTheDocument();
    await userEvent.click(view.getByRole("button", { name: "Logout" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});

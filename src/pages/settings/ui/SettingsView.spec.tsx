/**
 * @file Verifies the "SettingsView" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "composes the config form
 * under a compact page heading without a redundant surface".
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { ConfigFormFields } from "@/features/settings";
import { createConfig } from "@/entities/config";

vi.mock("@/features/settings", async () => {
  const { ConfigForm } = await vi.importActual<typeof import("@/features/settings/components/ConfigForm")>(
    "@/features/settings/components/ConfigForm"
  );
  return { ConfigForm };
});

import { SettingsView } from "./SettingsView";

const fields: ConfigFormFields = {
  showHeader: { name: "showHeader" },
  showSwipeButtonList: { name: "showSwipeButtonList" },
  showSwipeFeedback: { name: "showSwipeFeedback" },
  darkMode: { name: "darkMode" },
  shuffled: { name: "shuffled" },
  useCardInterval: { name: "useCardInterval" },
  maxNumberOfCardsToLearn: { name: "maxNumberOfCardsToLearn", value: "10", onChange: () => undefined },
  defaultAutoPlay: { name: "defaultAutoPlay" },
  cardInterval: { name: "cardInterval", value: "5", onChange: () => undefined },
};

describe("SettingsView", () => {
  afterEach(cleanup);

  it("composes the config form under a compact page heading without a redundant surface", () => {
    const view = render(
      <SettingsView
        configForm={{
          config: createConfig(),
          fields,
          maxNumberOfCardsToLearn: 10,
          cardInterval: 5,
        }}
      />
    );

    const heading = view.getByRole("heading", { level: 1, name: "Settings" });
    const shell = heading.closest("section");

    expect(view.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(shell).toHaveClass("mx-auto", "w-full", "max-w-reading");
    expect(shell).not.toHaveClass("rounded-surface", "border", "bg-surface");
    expect(heading).toHaveClass("text-title");
    expect(view.getByText("Changes are saved automatically")).toHaveClass("text-ink-muted");
    expect(shell).toContainElement(view.getByRole("heading", { level: 2, name: "Account" }).closest("section"));
  });
});

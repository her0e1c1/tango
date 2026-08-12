/**
 * @file Verifies the "ConfigFormTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "composes the config form
 * under a compact page heading without a redundant surface".
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { ConfigFormFields } from "@/features/settings/ui/components/ConfigForm";
import { ConfigFormTemplate } from "@/features/settings/ui/components/templates/ConfigFormTemplate";
import { createConfig } from "@/test/factories";

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

describe("ConfigFormTemplate", () => {
  it("composes the config form under a compact page heading without a redundant surface", () => {
    render(
      <ConfigFormTemplate
        configForm={{
          config: createConfig(),
          fields,
          maxNumberOfCardsToLearn: 10,
          cardInterval: 5,
        }}
      />
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Settings" });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(heading).toHaveClass("text-title");
    expect(screen.getByText("Changes are saved automatically")).toHaveClass("text-ink-muted");
    expect(screen.getByRole("region", { name: "Account" })).toBeInTheDocument();
  });
});

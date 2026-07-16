import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { ConfigFormFields } from "@/features/settings/components/ConfigForm";
import { ConfigFormTemplate } from "@/features/settings/components/templates/ConfigFormTemplate";
import { createConfig } from "@/test/factories";

const fields: ConfigFormFields = {
  showHeader: { name: "showHeader" },
  showSwipeButtonList: { name: "showSwipeButtonList" },
  showSwipeFeedback: { name: "showSwipeFeedback" },
  darkMode: { name: "darkMode" },
  localMode: { name: "localMode" },
  shuffled: { name: "shuffled" },
  useCardInterval: { name: "useCardInterval" },
  maxNumberOfCardsToLearn: { name: "maxNumberOfCardsToLearn", value: "10", onChange: () => undefined },
  defaultAutoPlay: { name: "defaultAutoPlay" },
  cardInterval: { name: "cardInterval", value: "5", onChange: () => undefined },
  githubAccessToken: { name: "githubAccessToken" },
};

describe("ConfigFormTemplate", () => {
  afterEach(cleanup);

  it("composes the config form under one page heading in a bounded semantic surface", () => {
    const view = render(
      <ConfigFormTemplate
        configForm={{
          config: createConfig(),
          fields,
          maxNumberOfCardsToLearn: 10,
          cardInterval: 5,
        }}
      />
    );

    const heading = view.getByRole("heading", { level: 1, name: "Settings" });
    const surface = heading.parentElement;

    expect(view.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(surface).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-reading",
      "rounded-surface",
      "border",
      "border-border",
      "bg-surface",
      "p-4",
      "md:p-6"
    );
    expect(surface).toContainElement(view.getByRole("heading", { level: 2, name: "Account" }).closest("section"));
  });
});

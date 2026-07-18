import { describe, expect, it } from "vitest";
import { withoutPwaPlugins } from "./.storybook/vitePlugins";

describe("Storybook Vite plugins", () => {
  it("excludes PWA plugins from Storybook builds", () => {
    const plugins = [
      { name: "vite:react-babel" },
      [
        { name: "vite-plugin-pwa" },
        { name: "vite-plugin-pwa:build" },
      ],
      { name: "storybook:core" },
    ];

    expect(withoutPwaPlugins(plugins)).toEqual([
      { name: "vite:react-babel" },
      { name: "storybook:core" },
    ]);
  });
});

import babel from "@rolldown/plugin-babel";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import { describe, expect, it } from "vitest";
import storybookConfig from "./.storybook/main";
import viteConfig from "./vite.config";
import vitestConfig from "./vitest.config";

const compilerPluginName = (await babel({
  presets: [reactCompilerPreset()],
})).name;

const collectPlugins = async (
  values: readonly unknown[] | undefined,
): Promise<object[]> => {
  const plugins: object[] = [];
  const collect = async (value: unknown): Promise<void> => {
    const resolved = await value;

    if (Array.isArray(resolved)) {
      await Promise.all(resolved.map(collect));
    } else if (typeof resolved === "object" && resolved !== null) {
      plugins.push(resolved);
    }
  };
  await Promise.all(values?.map(collect) ?? []);
  return plugins;
};

const compilerPlugins = async (values: readonly unknown[] | undefined) =>
  (await collectPlugins(values)).filter(
    (plugin) => "name" in plugin && plugin.name === compilerPluginName,
  );

describe("React Compiler Vite integration", () => {
  it("adds one compiler plugin to the application", async () => {
    expect(await compilerPlugins(viteConfig.plugins)).toHaveLength(1);
  });

  it("adds one compiler plugin to Vitest", async () => {
    expect(await compilerPlugins(vitestConfig.plugins)).toHaveLength(1);
  });

  it("adds one compiler plugin to Storybook", async () => {
    expect(storybookConfig.viteFinal).toBeTypeOf("function");
    const input = { plugins: [] };
    const output = await storybookConfig.viteFinal?.(
      input,
      { configType: "PRODUCTION" } as never,
    );

    expect(output).not.toBe(input);
    expect(await compilerPlugins(output?.plugins)).toHaveLength(1);
  });

  it("creates independent plugin instances for every environment", async () => {
    const storybookViteConfig = await storybookConfig.viteFinal?.(
      { plugins: [] },
      { configType: "PRODUCTION" } as never,
    );
    const instances = [
      ...(await compilerPlugins(viteConfig.plugins)),
      ...(await compilerPlugins(vitestConfig.plugins)),
      ...(await compilerPlugins(storybookViteConfig?.plugins)),
    ];

    expect(instances).toHaveLength(3);
    expect(new Set(instances).size).toBe(3);
  });
});

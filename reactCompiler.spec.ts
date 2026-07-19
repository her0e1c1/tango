// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import storybookConfig from "./.storybook/main";
import viteConfig from "./vite.config";
import vitestConfig from "./vitest.config";

const reactCompilerMock = vi.hoisted(() => {
  const compilerPluginName = "react-compiler-test-sentinel";
  let instance = 0;

  return {
    compilerPluginName,
    createReactCompilerPlugin: vi.fn(async () => ({
      name: compilerPluginName,
      instance: ++instance,
    })),
  };
});

vi.mock("./reactCompiler", () => ({
  createReactCompilerPlugin: reactCompilerMock.createReactCompilerPlugin,
}));

const { compilerPluginName, createReactCompilerPlugin } = reactCompilerMock;

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

const pluginNames = async (values: readonly unknown[] | undefined) =>
  (await collectPlugins(values)).flatMap((plugin) =>
    "name" in plugin && typeof plugin.name === "string" ? [plugin.name] : [],
  );

const storybookInput = { plugins: viteConfig.plugins ?? [] };
const storybookViteConfig = await storybookConfig.viteFinal?.(
  storybookInput,
  { configType: "PRODUCTION" } as never,
);

describe("React Compiler Vite integration", () => {
  it("calls the shared factory for the application and Vitest", () => {
    expect(createReactCompilerPlugin).toHaveBeenCalledTimes(2);
  });

  it("adds one compiler plugin to the application", async () => {
    expect(await compilerPlugins(viteConfig.plugins)).toHaveLength(1);
  });

  it("adds one compiler plugin to Vitest", async () => {
    expect(await compilerPlugins(vitestConfig.plugins)).toHaveLength(1);
  });

  it("keeps one compiler plugin from the root Vite configuration in Storybook", async () => {
    expect(storybookConfig.viteFinal).toBeTypeOf("function");
    expect(storybookViteConfig).not.toBe(storybookInput);
    expect(await compilerPlugins(storybookViteConfig?.plugins)).toHaveLength(1);
  });

  it("removes PWA plugins from the Storybook configuration", async () => {
    expect(await pluginNames(storybookViteConfig?.plugins)).not.toContain(
      "vite-plugin-pwa",
    );
    expect(await pluginNames(storybookViteConfig?.plugins)).not.toContain(
      "vite-plugin-pwa:build",
    );
  });

  it("creates independent plugin instances for the application and Vitest", async () => {
    const instances = [
      ...(await compilerPlugins(viteConfig.plugins)),
      ...(await compilerPlugins(vitestConfig.plugins)),
    ];

    expect(instances).toHaveLength(2);
    expect(new Set(instances).size).toBe(2);
  });
});

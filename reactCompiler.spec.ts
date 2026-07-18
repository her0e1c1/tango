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

const storybookInput = { plugins: [] };
const storybookViteConfig = await storybookConfig.viteFinal?.(
  storybookInput,
  { configType: "PRODUCTION" } as never,
);

describe("React Compiler Vite integration", () => {
  it("calls the shared factory once for every environment", () => {
    expect(createReactCompilerPlugin).toHaveBeenCalledTimes(3);
  });

  it("adds one compiler plugin to the application", async () => {
    expect(await compilerPlugins(viteConfig.plugins)).toHaveLength(1);
  });

  it("adds one compiler plugin to Vitest", async () => {
    expect(await compilerPlugins(vitestConfig.plugins)).toHaveLength(1);
  });

  it("adds one compiler plugin to Storybook", async () => {
    expect(storybookConfig.viteFinal).toBeTypeOf("function");
    expect(storybookViteConfig).not.toBe(storybookInput);
    expect(await compilerPlugins(storybookViteConfig?.plugins)).toHaveLength(1);
  });

  it("creates independent plugin instances for every environment", async () => {
    const instances = [
      ...(await compilerPlugins(viteConfig.plugins)),
      ...(await compilerPlugins(vitestConfig.plugins)),
      ...(await compilerPlugins(storybookViteConfig?.plugins)),
    ];

    expect(instances).toHaveLength(3);
    expect(new Set(instances).size).toBe(3);
  });
});

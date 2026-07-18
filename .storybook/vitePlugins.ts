import type { PluginOption } from "vite";

export function withoutPwaPlugins(
  plugins: PluginOption[] | undefined,
): PluginOption[] {
  return (plugins ?? []).flatMap((plugin) => {
    if (Array.isArray(plugin)) {
      return withoutPwaPlugins(plugin);
    }

    if (
      plugin &&
      typeof plugin === "object" &&
      "name" in plugin &&
      typeof plugin.name === "string" &&
      plugin.name.startsWith("vite-plugin-pwa")
    ) {
      return [];
    }

    return [plugin];
  });
}

import { test as base, expect, type Page } from "@playwright/test";
export { expect } from "@playwright/test";
export const test = base.extend<{
  browserErrors: string[];
  fixedTime: boolean;
}>({
  fixedTime: [true, { option: true }],
  browserErrors: [
    async ({ page, baseURL, fixedTime }, use) => {
      const errors: string[] = [];
      const external: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      if (!baseURL) throw new Error("Integration base URL is missing");
      const origin = new URL(baseURL).origin.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
      await page.route(new RegExp(`^(?!${origin}(?:/|$))https?://`, "u"), async (route) => {
        external.push(route.request().url());
        await route.abort();
      });
      if (fixedTime) await page.clock.setFixedTime(Date.UTC(2026, 6, 1, 12));
      await use(errors);
      expect(external).toEqual([]);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
export async function open(page: Page, domain: string, variant: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ scenario: domain, variant, ...params });
  await page.goto(`/?${query}`);
  await page.locator("#root > *").first().waitFor();
}
export function readEvents(page: Page): Promise<{ name: string; args: unknown[] }[]> {
  return page.evaluate(async () => {
    const path = "/io.ts";
    return (await import(path)).events;
  });
}
export function callScenario<T = unknown>(page: Page, domain: string, name: string, arg?: unknown): Promise<T> {
  return page.evaluate(
    async ({ scenarioDomain, exportName, value }) => {
      const path = `/scenarios/${scenarioDomain}.tsx`;
      const scenario = await import(path);
      return scenario[exportName](value);
    },
    { scenarioDomain: domain, exportName: name, value: arg }
  );
}

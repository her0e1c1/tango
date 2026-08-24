import { chromium, type FullConfig } from "@playwright/test";

import { routeAnonymousAuth, seedConfig } from "./fixtures";

const warmApplication = async (config: FullConfig) => {
  const endpoint = process.env.PW_TEST_CONNECT_WS_ENDPOINT;
  const browser = endpoint === undefined ? await chromium.launch() : await chromium.connect(endpoint);
  const page = await browser.newPage();
  await routeAnonymousAuth(page, "e2e-warmup-user");
  await seedConfig(page);

  const baseURL = String(config.projects[0]?.use.baseURL ?? "http://127.0.0.1:4173");
  await page.goto(baseURL, { timeout: 120_000 });
  await page.getByRole("heading", { level: 1, name: "Decks" }).waitFor({ timeout: 120_000 });
  await browser.close();
};

export default warmApplication;

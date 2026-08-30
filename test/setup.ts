import { beforeEach } from "vitest";

import { appI18n } from "@/app/i18n/instance";

beforeEach(async () => {
  await appI18n.changeLanguage("en");
  document.documentElement.lang = "en";
});

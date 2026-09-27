import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { beforeEach } from "vitest";

import { appI18n } from "@/app/i18n/instance";

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory();
  await appI18n.changeLanguage("en");
  document.documentElement.lang = "en";
});

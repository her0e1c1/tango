import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { verifyPwaBuild } from "./pwa-build-verifier.mjs";

const fixtureDirectories = [];
const icons = [
  { src: "tango-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  { src: "logo192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "logo512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "logo192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "logo512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];
const manifest = {
  id: "/",
  scope: "/",
  start_url: "/",
  name: "Tango Is Flashcards For Programmers",
  short_name: "Tango",
  description: "Flashcards For Programmers",
  display: "standalone",
  theme_color: "#f7f8fa",
  background_color: "#f7f8fa",
  icons,
};
const indexHtml = `<!doctype html>
<html><head><link rel="manifest" href="/manifest.json"></head><body>
<script id="vite-plugin-pwa:register-sw" src="/registerSW.js"></script>
<script type="module" src="/assets/index-AbCd1234.js"></script>
</body></html>`;
const registerServiceWorker = `if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js",{scope:"/"}))}`;
const precacheEntries = [
  "index.html",
  "assets/index-AbCd1234.js",
  "assets/index-EfGh5678.css",
  ...icons.map((icon) => icon.src),
];
const serviceWorker = `precacheAndRoute(${JSON.stringify(
  precacheEntries.map((url) => ({ url, revision: "revision" }))
)});cleanupOutdatedCaches();registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"),{denylist:[/^\\/__\\//]}));`;

afterEach(() => {
  for (const directory of fixtureDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function createFixture(overrides = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "tango-pwa-build-"));
  fixtureDirectories.push(directory);
  mkdirSync(path.join(directory, "assets"));

  const files = {
    "index.html": indexHtml,
    "manifest.json": JSON.stringify(manifest),
    "registerSW.js": registerServiceWorker,
    "sw.js": serviceWorker,
    "assets/index-AbCd1234.js": "export {};",
    "assets/index-EfGh5678.css": ":root{}",
    ...Object.fromEntries(icons.map((icon) => [icon.src, "asset"])),
    ...overrides,
  };

  for (const [relativePath, contents] of Object.entries(files)) {
    if (contents === null) continue;
    writeFileSync(path.join(directory, relativePath), contents);
  }

  return directory;
}

function replaceFile(directory, relativePath, transform) {
  const absolutePath = path.join(directory, relativePath);
  expect(existsSync(absolutePath)).toBe(true);
  writeFileSync(absolutePath, transform(readFileSync(absolutePath, "utf8")));
}

describe("production PWA build verifier", () => {
  it("accepts a complete root-scoped application shell", () => {
    expect(() => verifyPwaBuild(createFixture())).not.toThrow();
  });

  it.each(["index.html", "manifest.json", "registerSW.js", "sw.js"])("rejects a missing %s", (relativePath) => {
    expect(() => verifyPwaBuild(createFixture({ [relativePath]: null }))).toThrow(relativePath);
  });

  it("requires root manifest identity, scope, and start URL", () => {
    const directory = createFixture();
    replaceFile(directory, "manifest.json", (contents) => JSON.stringify({ ...JSON.parse(contents), scope: "/cards/" }));

    expect(() => verifyPwaBuild(directory)).toThrow(/manifest scope.*\/$/i);
  });

  it("requires every manifest icon to exist and be precached", () => {
    expect(() => verifyPwaBuild(createFixture({ "logo512-maskable.png": null }))).toThrow(/logo512-maskable\.png/);

    const directory = createFixture();
    replaceFile(directory, "sw.js", (contents) => contents.replace("logo512-maskable.png", "missing-maskable.png"));
    expect(() => verifyPwaBuild(directory)).toThrow(/precache.*logo512-maskable\.png/i);
  });

  it("requires manifest and deferred registration references in built HTML", () => {
    expect(() => verifyPwaBuild(createFixture({ "index.html": indexHtml.replace("/manifest.json", "/other.json") }))).toThrow(
      /manifest\.json/
    );
    expect(() => verifyPwaBuild(createFixture({ "index.html": indexHtml.replace("/registerSW.js", "/other.js") }))).toThrow(
      /registerSW\.js/
    );
  });

  it("requires root-scoped Service Worker registration", () => {
    expect(() =>
      verifyPwaBuild(createFixture({ "registerSW.js": registerServiceWorker.replace('scope:"/"', 'scope:"/cards/"') }))
    ).toThrow(/scope.*\/$/i);
  });

  it("requires app entry precaching, navigation fallback, and outdated cache cleanup", () => {
    expect(() => verifyPwaBuild(createFixture({ "sw.js": serviceWorker.replace("index.html", "offline.html") }))).toThrow(
      /index\.html/
    );
    expect(() =>
      verifyPwaBuild(
        createFixture({ "sw.js": serviceWorker.replace(/assets\/index-[A-Za-z0-9]+\.(?:js|css)/g, "main.asset") })
      )
    ).toThrow(/fingerprinted asset/i);
    expect(() =>
      verifyPwaBuild(createFixture({ "sw.js": serviceWorker.replace("createHandlerBoundToURL", "otherHandler") }))
    ).toThrow(/navigation fallback/i);
    expect(() =>
      verifyPwaBuild(createFixture({ "sw.js": serviceWorker.replace("cleanupOutdatedCaches", "keepOutdatedCaches") }))
    ).toThrow(/outdated precache/i);
  });

  it("rejects non-navigation runtime cache routes", () => {
    expect(() => verifyPwaBuild(createFixture({ "sw.js": `${serviceWorker}registerRoute(new Route());` }))).toThrow(
      /runtime cache route/i
    );
  });
});

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function assertBuild(condition, message) {
  if (!condition) throw new Error(message);
}

function readRequiredFile(buildDirectory, relativePath) {
  const absolutePath = path.join(buildDirectory, relativePath);
  assertBuild(existsSync(absolutePath), `Missing production PWA artifact: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

function hasManifestIcon(manifest, sizes, purpose) {
  return manifest.icons.some(
    (icon) => icon.sizes === sizes && icon.purpose?.split(/\s+/).includes(purpose) === true
  );
}

export function verifyPwaBuild(buildDirectory) {
  const indexHtml = readRequiredFile(buildDirectory, "index.html");
  const manifestText = readRequiredFile(buildDirectory, "manifest.json");
  const registerServiceWorker = readRequiredFile(buildDirectory, "registerSW.js");
  const serviceWorker = readRequiredFile(buildDirectory, "sw.js");

  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch (error) {
    throw new Error(`Invalid manifest.json: ${error.message}`);
  }

  for (const field of ["id", "scope", "start_url"]) {
    assertBuild(manifest[field] === "/", `Expected manifest ${field} to be /`);
  }
  assertBuild(Array.isArray(manifest.icons), "Expected manifest.json to declare icons");
  assertBuild(hasManifestIcon(manifest, "192x192", "any"), "Expected a regular 192x192 manifest icon");
  assertBuild(hasManifestIcon(manifest, "512x512", "any"), "Expected a regular 512x512 manifest icon");
  assertBuild(hasManifestIcon(manifest, "192x192", "maskable"), "Expected a maskable 192x192 manifest icon");
  assertBuild(hasManifestIcon(manifest, "512x512", "maskable"), "Expected a maskable 512x512 manifest icon");

  const manifestLink = /<link\b(?=[^>]*\brel=["']manifest["'])(?=[^>]*\bhref=["']\/manifest\.json["'])[^>]*>/i;
  const registrationScript = /<script\b(?=[^>]*\bsrc=["']\/registerSW\.js["'])[^>]*>/i;
  assertBuild(manifestLink.test(indexHtml), "Expected index.html to reference /manifest.json");
  assertBuild(registrationScript.test(indexHtml), "Expected index.html to load /registerSW.js");

  const rootRegistration = /serviceWorker\.register\(\s*["']\/sw\.js["']\s*,\s*\{\s*scope\s*:\s*["']\/["']/;
  assertBuild(rootRegistration.test(registerServiceWorker), "Expected Service Worker registration scope to be /");

  const precacheStart = serviceWorker.indexOf("precacheAndRoute");
  const cleanupStart = serviceWorker.indexOf("cleanupOutdatedCaches");
  assertBuild(precacheStart >= 0, "Expected Service Worker precache configuration");
  assertBuild(cleanupStart > precacheStart, "Expected Service Worker to clean outdated precaches");
  const precacheBlock = serviceWorker.slice(precacheStart, cleanupStart);
  assertBuild(precacheBlock.includes("index.html"), "Expected Service Worker to precache index.html");
  assertBuild(
    /assets\/[^"']+-[A-Za-z0-9_-]{6,}\.(?:js|css)/.test(precacheBlock),
    "Expected Service Worker to precache a fingerprinted asset"
  );

  for (const icon of manifest.icons) {
    const relativePath = icon.src.replace(/^\/+/, "");
    assertBuild(existsSync(path.join(buildDirectory, relativePath)), `Missing manifest icon: ${icon.src}`);
    assertBuild(precacheBlock.includes(icon.src), `Expected Service Worker to precache ${icon.src}`);
  }

  assertBuild(
    /createHandlerBoundToURL\(\s*["']index\.html["']\s*\)/.test(serviceWorker),
    "Expected Service Worker navigation fallback to index.html"
  );
  assertBuild(serviceWorker.includes("__"), "Expected navigation fallback to exclude Firebase reserved paths");

  const routeCount = serviceWorker.match(/registerRoute\(/g)?.length ?? 0;
  assertBuild(routeCount === 1, "Expected no non-navigation runtime cache route");
}

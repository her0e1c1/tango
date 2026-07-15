import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Logo } from "@/shared/components";

const projectRoot = process.cwd();
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const stockAssetHashes = new Set([
  "3d10f7da6c603178340081668c4ac5b3ae9743ca9a262ab0fcd312fbb9f48bdd",
  "c386396ec70db3608075b5fbfaac4ab1ccaa86ba05a68ab393ec551eb66c3e00",
  "9ea4f4da7050c0cc408926f6a39c253624e9babb1d43c7977cd821445a60b461",
]);

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

interface WebManifest {
  icons: ManifestIcon[];
  start_url: string;
  orientation: string;
  display: string;
  theme_color: string;
  background_color: string;
}

interface PngInfo {
  signature: boolean;
  chunkType: string;
  width: number;
  height: number;
}

interface IcoInfo {
  reserved: number;
  type: number;
  count: number;
  width: number;
  height: number;
}

afterEach(cleanup);

function projectPath(relativePath: string): string {
  return path.resolve(projectRoot, relativePath);
}

function readText(relativePath: string): string {
  const absolutePath = projectPath(relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

function readBytes(relativePath: string): Buffer {
  const absolutePath = projectPath(relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath) : Buffer.alloc(0);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function inspectPng(bytes: Buffer): PngInfo | undefined {
  if (bytes.length < 24) return undefined;

  return {
    signature: bytes.subarray(0, pngSignature.length).equals(pngSignature),
    chunkType: bytes.toString("ascii", 12, 16),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function inspectIco(bytes: Buffer): IcoInfo | undefined {
  if (bytes.length < 22) return undefined;

  const widthByte = bytes[6];
  const heightByte = bytes[7];
  if (widthByte === undefined || heightByte === undefined) return undefined;

  return {
    reserved: bytes.readUInt16LE(0),
    type: bytes.readUInt16LE(2),
    count: bytes.readUInt16LE(4),
    width: widthByte === 0 ? 256 : widthByte,
    height: heightByte === 0 ? 256 : heightByte,
  };
}

function hasLink(document: Document, attributes: Record<string, string>): boolean {
  return Array.from(document.querySelectorAll("link")).some((link) =>
    Object.entries(attributes).every(([name, value]) => link.getAttribute(name) === value)
  );
}

describe("Tango PWA identity", () => {
  it("provides a code-native Tango SVG mark without the stock React identity", () => {
    const relativePath = "public/tango-mark.svg";
    const mark = readText(relativePath);

    expect(existsSync(projectPath(relativePath))).toBe(true);
    expect(mark.trimStart()).toMatch(/^<svg\b/);
    expect(mark).toContain("<title>Tango</title>");
    expect(mark).toMatch(/viewBox=["']0 0 64 64["']/);
    expect(mark).toMatch(/#4f63b8/i);
    expect(mark).toMatch(/#2f7f78/i);
    expect(mark).toMatch(/#f8fafc/i);
    expect(mark).not.toMatch(/react|atom/i);
  });

  it("advertises SVG, fallback, touch, manifest, and light/dark browser colors", () => {
    const indexHtml = readText("index.html");
    const document = new DOMParser().parseFromString(indexHtml, "text/html");
    const faviconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
    const themeColors = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')).map(
      (meta) => ({
        content: meta.content,
        media: meta.getAttribute("media"),
      })
    );

    expect(faviconLinks.map((link) => link.getAttribute("href"))).toEqual(["/tango-mark.svg", "/favicon.ico"]);
    expect(hasLink(document, { rel: "icon", type: "image/svg+xml", href: "/tango-mark.svg" })).toBe(true);
    expect(hasLink(document, { rel: "alternate icon", href: "/favicon.ico" })).toBe(true);
    expect(hasLink(document, { rel: "apple-touch-icon", href: "/logo192.png" })).toBe(true);
    expect(hasLink(document, { rel: "manifest", href: "/manifest.json" })).toBe(true);
    expect(themeColors).toEqual([
      { content: "#f7f8fa", media: "(prefers-color-scheme: light)" },
      { content: "#111827", media: "(prefers-color-scheme: dark)" },
    ]);
  });

  it("declares truthful Tango icons and Calm Focus install colors", () => {
    const manifest = JSON.parse(readText("public/manifest.json")) as WebManifest;

    expect(manifest.icons).toEqual([
      {
        src: "tango-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "logo192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "logo512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ]);
    expect(manifest.icons.some((icon) => icon.purpose?.split(/\s+/).includes("maskable") === true)).toBe(false);
    expect(manifest.theme_color).toBe("#4f63b8");
    expect(manifest.background_color).toBe("#f7f8fa");
    expect(manifest.start_url).toBe(".");
    expect(manifest.orientation).toBe("landscape");
    expect(manifest.display).toBe("standalone");
  });

  it.each([
    ["public/logo192.png", 192],
    ["public/logo512.png", 512],
  ])("provides a real, non-stock %s raster icon", (relativePath, expectedSize) => {
    const bytes = readBytes(relativePath);
    const png = inspectPng(bytes);

    expect(png).toEqual({
      signature: true,
      chunkType: "IHDR",
      width: expectedSize,
      height: expectedSize,
    });
    expect(stockAssetHashes.has(sha256(bytes))).toBe(false);
  });

  it("provides a valid, non-stock 64px fallback icon", () => {
    const bytes = readBytes("public/favicon.ico");

    expect(inspectIco(bytes)).toEqual({
      reserved: 0,
      type: 1,
      count: 1,
      width: 64,
      height: 64,
    });
    expect(stockAssetHashes.has(sha256(bytes))).toBe(false);
  });

  it("renders the shared mark beside a visible accessible wordmark without changing interaction props", () => {
    const onClick = vi.fn();
    const view = render(createElement(Logo, { className: "contract-class", onClick }));
    const logo = view.getByRole("button", { name: "tango" });
    const mark = logo.querySelector('img[src="/tango-mark.svg"]');

    expect(logo).toHaveClass("contract-class", "text-accent-primary");
    expect(mark).toHaveAttribute("alt", "");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(view.getByText("tango")).toBeVisible();
    fireEvent.click(logo);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps the mark-only Logo accessible through the component API", () => {
    const view = render(createElement(Logo, { markOnly: true, onClick: vi.fn() }));

    expect(view.getByRole("button", { name: "tango" })).toBeInTheDocument();
    expect(view.getByText("tango")).toHaveClass("sr-only");
  });

  it("offers explicit Wordmark, MarkOnly, Light, and Dark Storybook review states", () => {
    const stories = readText("src/shared/components/content/Logo.stories.tsx");

    expect(stories).toMatch(/export const Wordmark:/);
    expect(stories).toMatch(/export const MarkOnly:[\s\S]*markOnly:\s*true/);
    expect(stories).toMatch(/export const Light:[\s\S]*theme:\s*["']light["']/);
    expect(stories).toMatch(/export const Dark:[\s\S]*theme:\s*["']dark["']/);
  });
});

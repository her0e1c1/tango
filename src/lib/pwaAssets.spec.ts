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
const expectedAssetHashes: Record<string, string> = {
  "public/favicon.ico": "6be21ee002b1722c176c87f8e1279a723bfc428105a952c6d7e76de30b9c6049",
  "public/logo192.png": "5e4927b22f2a8fa5d3245d71446caeebbd5d3f9f3ae4018ba004ea7482d10da2",
  "public/logo512.png": "1427fb898a5860df1b3c3bf69e4f06571a5df218a13746b4ec15f444a5063e28",
};
const rawPaletteUtility =
  /\b(?:bg|border|fill|stroke|text)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b/g;

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
  if (bytes.length < 33 || !bytes.subarray(0, pngSignature.length).equals(pngSignature)) return undefined;

  let offset = pngSignature.length;
  let ihdrCount = 0;
  let hasImageData = false;
  let hasTerminalEnd = false;

  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) return undefined;

    const chunkLength = bytes.readUInt32BE(offset);
    const chunkType = bytes.toString("ascii", offset + 4, offset + 8);
    const chunkEnd = offset + 12 + chunkLength;
    if (chunkEnd > bytes.length) return undefined;

    if (chunkType === "IHDR") {
      ihdrCount += 1;
      if (ihdrCount !== 1 || offset !== pngSignature.length || chunkLength !== 13) return undefined;
    } else if (ihdrCount === 0) {
      return undefined;
    }

    if (chunkType === "IDAT" && chunkLength > 0) hasImageData = true;
    if (chunkType === "IEND") {
      if (chunkLength !== 0 || chunkEnd !== bytes.length) return undefined;
      hasTerminalEnd = true;
    }

    offset = chunkEnd;
    if (hasTerminalEnd) break;
  }

  if (ihdrCount !== 1 || !hasImageData || !hasTerminalEnd || offset !== bytes.length) return undefined;

  return {
    signature: true,
    chunkType: bytes.toString("ascii", 12, 16),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function hasValidIcoPayload(
  bytes: Buffer,
  dataOffset: number,
  dataSize: number,
  width: number,
  height: number
): boolean {
  const payload = bytes.subarray(dataOffset, dataOffset + dataSize);
  if (payload.subarray(0, pngSignature.length).equals(pngSignature)) {
    const png = inspectPng(payload);
    return png?.width === width && png.height === height;
  }

  if (payload.length < 40) return false;

  const headerSize = payload.readUInt32LE(0);
  const dibWidth = Math.abs(payload.readInt32LE(4));
  const doubledDibHeight = Math.abs(payload.readInt32LE(8));
  const planes = payload.readUInt16LE(12);
  const bitDepth = payload.readUInt16LE(14);
  const compression = payload.readUInt32LE(16);
  const imageSize = payload.readUInt32LE(20);
  const bitmapStride = Math.ceil((width * bitDepth) / 32) * 4;
  const maskStride = Math.ceil(width / 32) * 4;

  return (
    headerSize >= 40 &&
    headerSize <= payload.length &&
    dibWidth === width &&
    doubledDibHeight === height * 2 &&
    planes === 1 &&
    bitDepth > 0 &&
    compression === 0 &&
    imageSize === bitmapStride * height &&
    headerSize + imageSize + maskStride * height <= payload.length
  );
}

function inspectIco(bytes: Buffer): IcoInfo | undefined {
  if (bytes.length < 6) return undefined;

  const reserved = bytes.readUInt16LE(0);
  const type = bytes.readUInt16LE(2);
  const count = bytes.readUInt16LE(4);
  if (reserved !== 0 || type !== 1 || count !== 1) return undefined;

  const directoryEnd = 6 + count * 16;
  if (bytes.length < directoryEnd) return undefined;

  const widthByte = bytes[6];
  const heightByte = bytes[7];
  if (widthByte === undefined || heightByte === undefined) return undefined;

  const width = widthByte === 0 ? 256 : widthByte;
  const height = heightByte === 0 ? 256 : heightByte;
  const dataSize = bytes.readUInt32LE(14);
  const dataOffset = bytes.readUInt32LE(18);
  if (
    bytes[9] !== 0 ||
    bytes.readUInt16LE(10) !== 1 ||
    bytes.readUInt16LE(12) === 0 ||
    dataSize === 0 ||
    dataOffset < directoryEnd ||
    dataOffset + dataSize !== bytes.length ||
    !hasValidIcoPayload(bytes, dataOffset, dataSize, width, height)
  ) {
    return undefined;
  }

  return {
    reserved,
    type,
    count,
    width,
    height,
  };
}

function hasLink(document: Document, attributes: Record<string, string>): boolean {
  return Array.from(document.querySelectorAll("link")).some((link) =>
    Object.entries(attributes).every(([name, value]) => link.getAttribute(name) === value)
  );
}

function storyBlock(source: string, storyName: string): string {
  const start = source.indexOf(`export const ${storyName}:`);
  if (start === -1) return "";

  const nextStory = source.indexOf("\nexport const ", start + 1);
  return source.slice(start, nextStory === -1 ? undefined : nextStory);
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
    expect(mark).not.toContain("<circle");
  });

  it("provides geometry-identical light and dark Card trail logos with outlined lettering", () => {
    const lightLogo = readText("public/tango-logo.svg");
    const darkLogo = readText("public/tango-logo-dark.svg");
    const normalizeThemeColors = (source: string) =>
      source.replace(/#f8fafc|#182231/gi, "SURFACE").replace(/#202936|#edf2f7/gi, "INK");

    expect(normalizeThemeColors(lightLogo)).toBe(normalizeThemeColors(darkLogo));

    for (const logo of [lightLogo, darkLogo]) {
      expect(logo.trimStart()).toMatch(/^<svg\b/);
      expect(logo).toContain("<title>Tango</title>");
      expect(logo).toMatch(/viewBox=["']0 0 216 64["']/);
      expect(logo).toContain('<rect x="36" y="14" width="176" height="42" rx="8"');
      expect(logo).toContain('<rect x="32" y="8" width="180" height="44" rx="8"');
      expect(logo).toContain('stroke-width="4.5"');
      expect(logo).toContain('stroke-linecap="round"');
      expect(logo).toContain('stroke-linejoin="round"');
      expect(logo).not.toContain("<text");
    }

    expect(lightLogo).toMatch(/#f8fafc/i);
    expect(lightLogo).toMatch(/#202936/i);
    expect(darkLogo).toMatch(/#182231/i);
    expect(darkLogo).toMatch(/#edf2f7/i);

    const darkMark = darkLogo.match(/<g data-logo-part="mark">([\s\S]*?)<\/g>/)?.[0];
    expect(darkMark).toMatch(/#f8fafc/i);
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

    expect(faviconLinks.map((link) => link.getAttribute("href"))).toEqual(["/favicon.ico", "/tango-mark.svg"]);
    expect(
      hasLink(document, {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "64x64",
        type: "image/x-icon",
      })
    ).toBe(true);
    expect(
      hasLink(document, {
        rel: "icon",
        href: "/tango-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
      })
    ).toBe(true);
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
    expect(sha256(bytes)).toBe(expectedAssetHashes[relativePath]);
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
    expect(sha256(bytes)).toBe(expectedAssetHashes["public/favicon.ico"]);
  });

  it("rejects a truncated PNG with plausible dimensions", () => {
    const truncatedPng = Buffer.alloc(24);
    pngSignature.copy(truncatedPng);
    truncatedPng.writeUInt32BE(13, 8);
    truncatedPng.write("IHDR", 12, "ascii");
    truncatedPng.writeUInt32BE(192, 16);
    truncatedPng.writeUInt32BE(192, 20);

    expect(inspectPng(truncatedPng)).toBeUndefined();
  });

  it("rejects a truncated ICO with a plausible directory entry", () => {
    const truncatedIco = Buffer.alloc(22);
    truncatedIco.writeUInt16LE(1, 2);
    truncatedIco.writeUInt16LE(1, 4);
    truncatedIco[6] = 64;
    truncatedIco[7] = 64;
    truncatedIco.writeUInt16LE(1, 10);
    truncatedIco.writeUInt16LE(32, 12);
    truncatedIco.writeUInt32LE(1, 14);
    truncatedIco.writeUInt32LE(22, 18);

    expect(inspectIco(truncatedIco)).toBeUndefined();
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
    const markOnly = storyBlock(stories, "MarkOnly");
    const light = storyBlock(stories, "Light");
    const dark = storyBlock(stories, "Dark");

    expect(storyBlock(stories, "Wordmark")).not.toBe("");
    expect(markOnly).toMatch(/args:\s*\{[\s\S]*markOnly:\s*true/);
    expect(light).toMatch(/globals:\s*\{[\s\S]*theme:\s*["']light["']/);
    expect(dark).toMatch(/globals:\s*\{[\s\S]*theme:\s*["']dark["']/);
    expect(stories.match(rawPaletteUtility) ?? []).toEqual([]);
  });
});

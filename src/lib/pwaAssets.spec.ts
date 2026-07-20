/**
 * @file Verifies the "Tango PWA identity" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "provides a code-native
 * Tango SVG mark without the stock React identity", "provides geometry-identical light and dark
 * Card trail logos with outlined lettering", "displays the light and dark Card trail logo as the
 * README heading".
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Logo } from "@/components";
import { pwaOptions } from "../../pwaConfig";

const projectRoot = process.cwd();
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const stockAssetHashes = new Set([
  "3d10f7da6c603178340081668c4ac5b3ae9743ca9a262ab0fcd312fbb9f48bdd",
  "c386396ec70db3608075b5fbfaac4ab1ccaa86ba05a68ab393ec551eb66c3e00",
  "9ea4f4da7050c0cc408926f6a39c253624e9babb1d43c7977cd821445a60b461",
]);
const expectedAssetHashes: Record<string, string> = {
  "public/favicon.ico": "20aa3dc1c0d77a68b69b43c5f707585a20df5940dfe126abd5868e4e6ef3e03e",
  "public/logo192.png": "56f25aadf5cea00c3e777f24776d3c5ced2c65afb86b1df6fea2c883478b9b4f",
  "public/logo512.png": "fecd457bd9fe9f60c27a62911db7d047f14a591f85032a9a5a66136397dfe9a4",
};
const rawPaletteUtility =
  /\b(?:bg|border|fill|stroke|text)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b/g;

interface PngInfo {
  signature: boolean;
  chunkType: string;
  width: number;
  height: number;
}

interface DecodedPng {
  width: number;
  height: number;
  pixels: Buffer;
}

interface ArtworkBounds {
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

/**
 * Provides the project path test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function projectPath(relativePath: string): string {
  return path.resolve(projectRoot, relativePath);
}

/**
 * Reads text needed by the test.
 * File access stays in one helper so assertions work with consistent paths and encoding.
 */
function readText(relativePath: string): string {
  const absolutePath = projectPath(relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

/**
 * Reads bytes needed by the test.
 * File access stays in one helper so assertions work with consistent paths and encoding.
 */
function readBytes(relativePath: string): Buffer {
  const absolutePath = projectPath(relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath) : Buffer.alloc(0);
}

/**
 * Provides the sha256 test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Provides the inspect png test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
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

/**
 * Provides the paeth predictor test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function paethPredictor(left: number, above: number, upperLeft: number): number {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

/**
 * Provides the decode rgba png test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function decodeRgbaPng(bytes: Buffer): DecodedPng | undefined {
  const png = inspectPng(bytes);
  if (
    png === undefined ||
    bytes[24] !== 8 ||
    bytes[25] !== 6 ||
    bytes[26] !== 0 ||
    bytes[27] !== 0 ||
    bytes[28] !== 0
  ) {
    return undefined;
  }

  const idatChunks: Buffer[] = [];
  let offset = pngSignature.length;
  while (offset < bytes.length) {
    const chunkLength = bytes.readUInt32BE(offset);
    const chunkType = bytes.toString("ascii", offset + 4, offset + 8);
    if (chunkType === "IDAT") idatChunks.push(bytes.subarray(offset + 8, offset + 8 + chunkLength));
    offset += chunkLength + 12;
    if (chunkType === "IEND") break;
  }

  let scanlines: Buffer;
  try {
    scanlines = inflateSync(Buffer.concat(idatChunks));
  } catch {
    return undefined;
  }

  const bytesPerPixel = 4;
  const rowLength = png.width * bytesPerPixel;
  if (scanlines.length !== (rowLength + 1) * png.height) return undefined;

  const pixels = Buffer.alloc(rowLength * png.height);
  let inputOffset = 0;
  for (let y = 0; y < png.height; y += 1) {
    const filterType = scanlines.readUInt8(inputOffset);
    inputOffset += 1;
    const rowOffset = y * rowLength;

    for (let x = 0; x < rowLength; x += 1) {
      const rawByte = scanlines.readUInt8(inputOffset);
      inputOffset += 1;
      const left = x >= bytesPerPixel ? pixels.readUInt8(rowOffset + x - bytesPerPixel) : 0;
      const above = y > 0 ? pixels.readUInt8(rowOffset + x - rowLength) : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? pixels.readUInt8(rowOffset + x - rowLength - bytesPerPixel) : 0;

      let predictor: number;
      if (filterType === 0) predictor = 0;
      else if (filterType === 1) predictor = left;
      else if (filterType === 2) predictor = above;
      else if (filterType === 3) predictor = Math.floor((left + above) / 2);
      else if (filterType === 4) predictor = paethPredictor(left, above, upperLeft);
      else return undefined;

      pixels.writeUInt8((rawByte + predictor) & 0xff, rowOffset + x);
    }
  }

  return { width: png.width, height: png.height, pixels };
}

/**
 * Provides the artwork bounds test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function artworkBounds(png: DecodedPng): ArtworkBounds | undefined {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      const red = png.pixels.readUInt8(offset);
      const green = png.pixels.readUInt8(offset + 1);
      const blue = png.pixels.readUInt8(offset + 2);
      const alpha = png.pixels.readUInt8(offset + 3);
      if (alpha === 0 || (red >= 250 && green >= 250 && blue >= 250)) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return maxX === -1 ? undefined : { width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Provides the ico png payload test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function icoPngPayload(bytes: Buffer): Buffer | undefined {
  if (inspectIco(bytes) === undefined) return undefined;

  const dataSize = bytes.readUInt32LE(14);
  const dataOffset = bytes.readUInt32LE(18);
  const payload = bytes.subarray(dataOffset, dataOffset + dataSize);
  return payload.subarray(0, pngSignature.length).equals(pngSignature) ? payload : undefined;
}

/**
 * Runs the shared expect artwork fills canvas assertions for one test subject.
 * Keeping the repeated expectations together lets each test emphasize the scenario being checked.
 */
function expectArtworkFillsCanvas(bytes: Buffer, expectedSize: number): void {
  const png = decodeRgbaPng(bytes);
  expect(png).toBeDefined();
  if (png === undefined) return;

  const bounds = artworkBounds(png);
  expect(bounds).toBeDefined();
  expect(png.width).toBe(expectedSize);
  expect(png.height).toBe(expectedSize);
  expect(bounds?.width).toBeGreaterThanOrEqual(expectedSize * 0.85);
  expect(bounds?.height).toBeGreaterThanOrEqual(expectedSize * 0.85);
}

/**
 * Runs the shared expect transparent canvas assertions for one test subject.
 * Keeping the repeated expectations together lets each test emphasize the scenario being checked.
 */
function expectTransparentCanvas(bytes: Buffer): void {
  const png = decodeRgbaPng(bytes);
  expect(png).toBeDefined();
  if (png === undefined) return;

  const cornerAlphaOffsets = [3, (png.width - 1) * 4 + 3, (png.height - 1) * png.width * 4 + 3, png.pixels.length - 1];
  expect(cornerAlphaOffsets.map((offset) => png.pixels.readUInt8(offset))).toEqual([0, 0, 0, 0]);

  let nonOpaquePixels = 0;
  let partiallyTransparentPixels = 0;
  for (let offset = 3; offset < png.pixels.length; offset += 4) {
    const alpha = png.pixels.readUInt8(offset);
    if (alpha < 255) nonOpaquePixels += 1;
    if (alpha > 0 && alpha < 255) partiallyTransparentPixels += 1;
  }

  expect(nonOpaquePixels).toBeGreaterThan(0);
  expect(partiallyTransparentPixels).toBeGreaterThan(0);
}

/**
 * Evaluates the has valid ico payload condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
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

/**
 * Provides the inspect ico test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
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

/**
 * Evaluates the has link condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function hasLink(document: Document, attributes: Record<string, string>): boolean {
  return Array.from(document.querySelectorAll("link")).some((link) =>
    Object.entries(attributes).every(([name, value]) => link.getAttribute(name) === value)
  );
}

/**
 * Provides the story block test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function storyBlock(source: string, storyName: string): string {
  const start = source.indexOf(`export const ${storyName}:`);
  if (start === -1) return "";

  const nextStory = source.indexOf("\nexport const ", start + 1);
  return source.slice(start, nextStory === -1 ? undefined : nextStory);
}

describe("Tango PWA identity", () => {
  const canonicalMarkShapes = [
    '<rect x="3" y="3" width="58" height="58" rx="17" fill="#4f63b8" />',
    '<rect x="18" y="14" width="34" height="27" rx="6" fill="#2f7f78" />',
    '<rect x="12" y="21" width="36" height="28" rx="6" fill="#f8fafc" />',
    '<path d="M20 28h20v4.5h-7.5V44h-5V32.5H20z" fill="#4f63b8" />',
  ];
  const canonicalLetterPaths = [
    "M97 25v19 M97 34c0-6-4-10-9-10s-10 4-10 10 4 10 10 10 9-4 9-10",
    "M112 44V25m0 8c2-6 6-9 11-9 6 0 9 4 9 10v10",
    "M165 25v17c0 8-4 12-11 12-5 0-9-2-11-5 M165 34c0-6-4-10-10-10s-10 4-10 10 4 10 10 10 10-4 10-10",
    "M189 24c-7 0-11 4-11 10s4 10 11 10 11-4 11-10-4-10-11-10z",
  ];

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
    expect(mark.match(/<(?:rect|path)\b[^>]*\/>/g)).toEqual(canonicalMarkShapes);
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
      expect(logo).toContain('stroke-width="4.5"');
      expect(logo).toContain('stroke-linecap="round"');
      expect(logo).toContain('stroke-linejoin="round"');
      expect(logo).not.toContain("<text");

      const letterGroup = logo.match(/<g fill="none"[^>]*>([\s\S]*?)<\/g>/)?.[1] ?? "";
      const letterPaths = Array.from(letterGroup.matchAll(/<path d="([^"]+)" \/>/g), ([, pathData]) => pathData);
      expect(letterPaths).toEqual(canonicalLetterPaths);

      const markGroup = logo.match(/<g data-logo-part="mark">([\s\S]*?)<\/g>/)?.[1] ?? "";
      expect(markGroup.match(/<(?:rect|path)\b[^>]*\/>/g)).toEqual(canonicalMarkShapes);
    }

    const rearTrailCard = '<rect x="36" y="14" width="176" height="42" rx="8" fill="#2f7f78" />';
    expect(lightLogo).toContain(rearTrailCard);
    expect(darkLogo).toContain(rearTrailCard);
    expect(lightLogo).toContain('<rect x="32" y="8" width="180" height="44" rx="8" fill="#f8fafc" />');
    expect(lightLogo).toContain(
      '<g fill="none" stroke="#202936" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">'
    );
    expect(darkLogo).toContain('<rect x="32" y="8" width="180" height="44" rx="8" fill="#182231" />');
    expect(darkLogo).toContain(
      '<g fill="none" stroke="#edf2f7" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">'
    );

    const darkMark = darkLogo.match(/<g data-logo-part="mark">([\s\S]*?)<\/g>/)?.[0];
    expect(darkMark).toMatch(/#f8fafc/i);
  });

  it("displays the light and dark Card trail logo as the README heading", () => {
    const readme = readText("README.md");

    expect(readme).toContain("<h1>");
    expect(readme).toContain('<source media="(prefers-color-scheme: dark)" srcset="./public/tango-logo-dark.svg">');
    expect(readme).toContain('<img src="./public/tango-logo.svg" alt="Tango" width="216" height="64">');
    expect(readme).not.toMatch(/^# Tango$/m);
  });

  it("advertises SVG, fallback, touch, and light/dark browser colors without a handwritten manifest", () => {
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
    expect(hasLink(document, { rel: "apple-touch-icon", href: "/apple-touch-icon.png" })).toBe(true);
    expect(hasLink(document, { rel: "manifest", href: "/manifest.json" })).toBe(false);
    expect(themeColors).toEqual([
      { content: "#f7f8fa", media: "(prefers-color-scheme: light)" },
      { content: "#111827", media: "(prefers-color-scheme: dark)" },
    ]);
  });

  it("declares truthful Tango icons and Calm Focus install colors", () => {
    const manifest = pwaOptions.manifest;

    expect(manifest.icons).toEqual([
      {
        src: "tango-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "logo192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "logo512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "logo192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "logo512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
    expect(manifest.id).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.name).toBe("Tango Is Flashcards For Programmers");
    expect(manifest.short_name).toBe("Tango");
    expect(manifest.description).toBe("Flashcards For Programmers");
    expect(manifest.theme_color).toBe("#f7f8fa");
    expect(manifest.background_color).toBe("#f7f8fa");
    expect(manifest.display).toBe("standalone");
    expect(manifest).not.toHaveProperty("orientation");
  });

  it.each([
    ["public/logo192-maskable.png", 192],
    ["public/logo512-maskable.png", 512],
    ["public/apple-touch-icon.png", 180],
  ])("provides an opaque install asset at %s", (relativePath, expectedSize) => {
    const bytes = readBytes(relativePath);

    expect(inspectPng(bytes)).toMatchObject({ width: expectedSize, height: expectedSize });
    expect(bytes[25]).toBe(2);
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

  it.each([
    ["public/logo192.png", 192],
    ["public/logo512.png", 512],
  ])("fills at least 85% of the %s canvas with decoded artwork", (relativePath, expectedSize) => {
    expectArtworkFillsCanvas(readBytes(relativePath), expectedSize);
  });

  it("fills at least 85% of the favicon canvas with decoded artwork", () => {
    const payload = icoPngPayload(readBytes("public/favicon.ico"));

    expect(payload).toBeDefined();
    if (payload !== undefined) expectArtworkFillsCanvas(payload, 64);
  });

  it.each(["public/logo192.png", "public/logo512.png"])("preserves transparent canvas pixels in %s", (relativePath) => {
    expectTransparentCanvas(readBytes(relativePath));
  });

  it("preserves transparent canvas pixels in the favicon", () => {
    const payload = icoPngPayload(readBytes("public/favicon.ico"));

    expect(payload).toBeDefined();
    if (payload !== undefined) expectTransparentCanvas(payload);
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

  it("renders the shared mark wordmark assets with accessible text without changing interaction props", () => {
    const onClick = vi.fn();
    const view = render(createElement(Logo, { className: "contract-class", onClick }));
    const logo = view.getByRole("button", { name: "tango" });
    const lightLogo = logo.querySelector('img[src="/tango-logo.svg"]');
    const darkLogo = logo.querySelector('img[src="/tango-logo-dark.svg"]');

    expect(logo).toHaveClass("contract-class");
    for (const image of [lightLogo, darkLogo]) {
      expect(image).toHaveAttribute("alt", "");
      expect(image).toHaveAttribute("aria-hidden", "true");
      expect(image).toHaveAttribute("width", "108");
      expect(image).toHaveAttribute("height", "32");
    }
    expect(view.getByText("tango")).toHaveClass("sr-only");
    fireEvent.click(logo);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps the mark-only Logo accessible through the component API", () => {
    const view = render(createElement(Logo, { markOnly: true, onClick: vi.fn() }));
    const logo = view.getByRole("button", { name: "tango" });

    expect(logo.querySelector('img[src="/tango-mark.svg"]')).toBeInTheDocument();
    expect(logo.querySelector('img[src="/tango-logo.svg"]')).not.toBeInTheDocument();
    expect(logo.querySelector('img[src="/tango-logo-dark.svg"]')).not.toBeInTheDocument();
    expect(view.getByText("tango")).toHaveClass("sr-only");
  });

  it("offers explicit Wordmark, MarkOnly, Light, and Dark Storybook review states", () => {
    const stories = readText("src/components/content/Logo.stories.tsx");
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

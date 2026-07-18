import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicDirectory = path.join(projectRoot, "public");
const mark = await readFile(path.join(publicDirectory, "tango-mark.svg"), "utf8");
const remoteEndpoint = process.env.PW_TEST_CONNECT_WS_ENDPOINT;
const browser = remoteEndpoint ? await chromium.connect(remoteEndpoint) : await chromium.launch({ headless: true });

async function renderMark(size, { background = "transparent", scale = 1 } = {}) {
  const context = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });

  try {
    const page = await context.newPage();
    const artworkSize = `${scale * 100}%`;
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%;background:${background}}body{display:grid;place-items:center}svg{display:block;width:${artworkSize};height:${artworkSize}}</style>${mark}`
    );
    return await page.screenshot({ omitBackground: background === "transparent", type: "png" });
  } finally {
    await context.close();
  }
}

function createIco(png) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(64, 6);
  header.writeUInt8(64, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

try {
  const [logo512, logo192, logo512Maskable, logo192Maskable, appleTouchIcon, faviconPng] = await Promise.all([
    renderMark(512),
    renderMark(192),
    renderMark(512, { background: "#f7f8fa", scale: 0.72 }),
    renderMark(192, { background: "#f7f8fa", scale: 0.72 }),
    renderMark(180, { background: "#f7f8fa", scale: 0.8 }),
    renderMark(64),
  ]);
  await Promise.all([
    writeFile(path.join(publicDirectory, "logo512.png"), logo512),
    writeFile(path.join(publicDirectory, "logo192.png"), logo192),
    writeFile(path.join(publicDirectory, "logo512-maskable.png"), logo512Maskable),
    writeFile(path.join(publicDirectory, "logo192-maskable.png"), logo192Maskable),
    writeFile(path.join(publicDirectory, "apple-touch-icon.png"), appleTouchIcon),
    writeFile(path.join(publicDirectory, "favicon.ico"), createIco(faviconPng)),
  ]);
} finally {
  await browser.close();
}

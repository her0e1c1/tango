import { glob, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const buildDirectory = resolve(process.argv[2] ?? "build");
const mapFiles = [];
for await (const path of glob(join(buildDirectory, "assets", "*.js.map"))) {
  mapFiles.push(path);
}

let runtimeSource;
for (const path of mapFiles) {
  const sourceMap = JSON.parse(await readFile(path, "utf8"));
  runtimeSource = sourceMap.sources.find((source) =>
    source.includes("react-compiler-runtime"),
  );
  if (runtimeSource) break;
}

if (!runtimeSource) {
  throw new Error("React Compiler runtime was not found in production source maps");
}

const cacheCall = /const \$ = \(0, [\w$]+\.c\)\(\d+\);/;
let compiledAsset;
for await (const path of glob(join(buildDirectory, "assets", "*.js"))) {
  if (cacheCall.test(await readFile(path, "utf8"))) {
    compiledAsset = path;
    break;
  }
}

if (!compiledAsset) {
  throw new Error("React Compiler cache calls were not found in production JavaScript");
}

console.log(`React Compiler runtime: ${runtimeSource}`);
console.log(`React Compiler output: ${compiledAsset}`);

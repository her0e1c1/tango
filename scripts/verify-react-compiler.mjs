import { glob, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const buildDirectory = resolve(process.argv[2] ?? "build");
const mapFiles = [];
for await (const path of glob(join(buildDirectory, "assets", "*.js.map"))) {
  mapFiles.push(path);
}

const runtimeSourcePath = "node_modules/react/cjs/react-compiler-runtime.production.js";
let runtimeSource;
let compiledAsset;
for (const path of mapFiles) {
  const sourceMap = JSON.parse(await readFile(path, "utf8"));
  runtimeSource = sourceMap.sources.find((source) =>
    source.replaceAll("\\", "/").endsWith(runtimeSourcePath),
  );
  if (runtimeSource) {
    compiledAsset = path.slice(0, -".map".length);
    break;
  }
}

if (!runtimeSource) {
  throw new Error("React Compiler runtime was not found in production source maps");
}

const compiledSource = await readFile(compiledAsset, "utf8");
const compilerRuntimeImport = /\b(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*require_compiler_runtime\(\s*\)\s*;/.exec(
  compiledSource,
);
if (!compilerRuntimeImport) {
  throw new Error("React Compiler runtime import was not found in production JavaScript");
}

const compilerRuntimeIdentifier = compilerRuntimeImport[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cacheCall = new RegExp(
  `const\\s+\\$\\s*=\\s*\\(\\s*0\\s*,\\s*${compilerRuntimeIdentifier}\\s*\\.\\s*c\\s*\\)\\s*\\(\\s*\\d+\\s*\\)\\s*;`,
);
if (!cacheCall.test(compiledSource)) {
  throw new Error("React Compiler cache calls were not found in production JavaScript");
}

console.log(`React Compiler runtime: ${runtimeSource}`);
console.log(`React Compiler output: ${compiledAsset}`);

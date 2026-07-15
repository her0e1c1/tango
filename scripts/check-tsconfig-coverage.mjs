import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const configNames = ["tsconfig.json", "tsconfig.node.json"];

const formatDiagnostic = (diagnostic) =>
  ts.formatDiagnostic(diagnostic, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => repositoryRoot,
    getNewLine: () => "\n",
  });

const configuredFiles = new Set();

for (const configName of configNames) {
  const configPath = path.join(repositoryRoot, configName);
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) {
    process.stderr.write(formatDiagnostic(error));
    process.exit(1);
  }

  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, repositoryRoot, undefined, configPath);
  if (parsed.errors.length > 0) {
    for (const diagnostic of parsed.errors) {
      process.stderr.write(formatDiagnostic(diagnostic));
    }
    process.exit(1);
  }

  for (const fileName of parsed.fileNames) {
    const relativePath = path.relative(repositoryRoot, fileName);
    const repositoryPath = relativePath.split(path.sep).join("/");
    if (
      relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath) &&
      repositoryPath !== "node_modules" &&
      !repositoryPath.startsWith("node_modules/")
    ) {
      configuredFiles.add(repositoryPath);
    }
  }
}

const trackedFiles = execFileSync(
  "git",
  ["-C", repositoryRoot, "ls-files", "-z", "--", ":(glob)**/*.ts", ":(glob)**/*.tsx"],
  { encoding: "utf8" }
)
  .split("\0")
  .filter(Boolean);

const missingFiles = trackedFiles.filter((fileName) => !configuredFiles.has(fileName)).sort();

if (missingFiles.length > 0) {
  process.stderr.write("Tracked TypeScript files missing from tsconfig coverage:\n");
  for (const fileName of missingFiles) {
    process.stderr.write(`${fileName}\n`);
  }
  process.exit(1);
}

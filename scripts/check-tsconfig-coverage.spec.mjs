import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const scriptPath = path.join(repositoryRoot, "scripts/check-tsconfig-coverage.mjs");
const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("check-tsconfig-coverage", () => {
  it("marks the repository as safe before asking Git for tracked files", () => {
    const fakeBin = mkdtempSync(path.join(tmpdir(), "tango-coverage-git-"));
    temporaryDirectories.push(fakeBin);

    const fakeGit = path.join(fakeBin, "git");
    writeFileSync(
      fakeGit,
      `#!/usr/bin/env node
const args = process.argv.slice(2);
const root = process.env.EXPECTED_REPOSITORY_ROOT;
const expectedPrefix = ["-c", \`safe.directory=\${root}\`, "-C", root, "ls-files"];
if (!expectedPrefix.every((argument, index) => args[index] === argument)) {
  process.stderr.write(\`unsafe git invocation: \${JSON.stringify(args)}\\n\`);
  process.exit(23);
}
`,
      "utf8"
    );
    chmodSync(fakeGit, 0o755);

    const result = spawnSync(process.execPath, [scriptPath], {
      encoding: "utf8",
      env: {
        ...process.env,
        EXPECTED_REPOSITORY_ROOT: repositoryRoot,
        PATH: `${fakeBin}${path.delimiter}${process.env.PATH ?? ""}`,
      },
    });

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });
});

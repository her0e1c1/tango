import assert from "node:assert/strict";
import { ESLint } from "eslint";

const eslint = new ESLint();

async function expectBoundaryResult(name, code, filePath, expectedErrors) {
  const [result] = await eslint.lintText(code, { filePath });

  assert.ok(result, `${name}: ESLint did not return a result`);
  assert.equal(result.errorCount, expectedErrors, `${name}: unexpected lint errors`);
}

await expectBoundaryResult(
  "alias import to another feature",
  'import "@/features/study/state/studyStore";',
  "src/features/deck/boundaryFixture.ts",
  1,
);
await expectBoundaryResult(
  "relative import to another feature",
  'import "../study/state/studyStore";',
  "src/features/deck/boundaryFixture.ts",
  1,
);
await expectBoundaryResult(
  "import within the same feature",
  'import "./components/DeckCard";',
  "src/features/deck/boundaryFixture.ts",
  0,
);
await expectBoundaryResult(
  "import to shared code",
  'import "@/lib/date";',
  "src/features/deck/boundaryFixture.ts",
  0,
);
await expectBoundaryResult(
  "import from a page to a feature",
  'import "@/features/deck/components/DeckCard";',
  "src/page/boundaryFixture.ts",
  0,
);

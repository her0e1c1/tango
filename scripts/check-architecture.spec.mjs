import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateArchitecture } from "./check-architecture.mjs";

const withFixture = (files, callback) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tango-architecture-"));
  try {
    for (const [file, contents] of Object.entries(files)) {
      const filePath = path.join(root, file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, contents);
    }
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

const validTree = {
  "src/shared/ui/button/index.ts": 'export { Button } from "./Button";\n',
  "src/shared/ui/button/Button.tsx": "export const Button = () => null;\n",
  "src/entities/card/index.ts": 'export type { Card } from "./model/card";\n',
  "src/entities/card/model/card.ts": "export interface Card { id: string }\n",
  "src/features/study/index.ts": 'export { StudyButton } from "./components/StudyButton";\n',
  "src/features/study/components/StudyButton.tsx":
    'import type { Card } from "@/entities/card";\nimport { Button } from "@/shared/ui/button";\nexport const StudyButton = (_props: { card: Card }) => Button;\n',
  "src/pages/deck/index.ts": 'export { DeckPage } from "./ui/DeckPage";\n',
  "src/pages/deck/ui/DeckPage.tsx":
    'import { StudyButton } from "@/features/study";\nexport const DeckPage = StudyButton;\n',
  "src/app/App.tsx": 'import { DeckPage } from "@/pages/deck";\nexport const App = DeckPage;\n',
  "src/vite-env.d.ts": "interface ImportMetaEnv {}\n",
};

test("accepts lower-layer public APIs and relative same-slice imports", () =>
  withFixture(validTree, (root) => assert.deepEqual(validateArchitecture(root), [])));

test("rejects higher, same-layer, deep, and self-alias imports", () =>
  withFixture(
    {
      ...validTree,
      "src/entities/card/model/card.ts":
        'import { DeckPage } from "@/pages/deck";\nexport interface Card { id: string }\n',
      "src/features/search/index.ts": 'export { search } from "./search";\n',
      "src/features/search/search.ts":
        'import { StudyButton } from "@/features/study";\nexport const search = StudyButton;\n',
      "src/pages/deck/ui/DeckPage.tsx":
        'import { StudyButton } from "@/features/study/components/StudyButton";\nexport const DeckPage = StudyButton;\n',
      "src/features/study/components/StudyButton.tsx":
        'import { StudyButton as Self } from "@/features/study";\nexport const StudyButton = Self;\n',
    },
    (root) => {
      const rules = validateArchitecture(root).map(({ rule }) => rule);
      assert.ok(rules.includes("layer-direction"));
      assert.ok(rules.includes("public-api"));
      assert.ok(rules.includes("slice-import"));
    }
  ));

test("rejects legacy source entries, catch-all directories, and barrels", () =>
  withFixture(
    {
      ...validTree,
      "src/services/write.ts": "export const write = true;\n",
      "src/features/study/state/session.ts": "export const session = true;\n",
      "src/features/index.ts": 'export * from "./study";\n',
      "src/features/study/components/index.ts": 'export * from "./StudyButton";\n',
    },
    (root) => {
      const rules = validateArchitecture(root).map(({ rule }) => rule);
      assert.ok(rules.includes("source-tree"));
      assert.ok(rules.includes("directory-name"));
      assert.ok(rules.includes("public-api"));
    }
  ));

test("keeps presentation independent from routing, stores, auth, and Firebase", () =>
  withFixture(
    {
      ...validTree,
      "src/features/study/components/StudyButton.tsx":
        'import { useNavigate } from "react-router-dom";\nimport { auth } from "@/shared/firebase";\nexport const StudyButton = () => [useNavigate, auth];\n',
      "src/shared/firebase/index.ts": "export const auth = {};\n",
    },
    (root) => {
      const errors = validateArchitecture(root).filter(({ rule }) => rule === "presentation-boundary");
      assert.equal(errors.length, 2);
    }
  ));

test("requires focused public APIs between Shared modules", () =>
  withFixture(
    {
      ...validTree,
      "src/shared/lib/format/index.ts": 'export { format } from "./format";\n',
      "src/shared/lib/format/format.ts":
        'import { Button } from "@/shared/ui/button/Button";\nexport const format = Button;\n',
    },
    (root) => {
      const errors = validateArchitecture(root).filter(({ rule }) => rule === "public-api");
      assert.equal(errors.length, 1);
      assert.match(errors[0].message, /focused public API/);
    }
  ));

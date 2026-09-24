vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock("@/shared/files", () => ({ downloadTextFile: mocks.download }));
import { downloadDeckImportExample } from "./downloadDeckImportExample";
import { parseCsv } from "../../lib/cardCsv";

describe("Example downloads [DECK-IMPORT-06]", () => {
  it.each([
    { id: "basic", count: 3, front: "apple", back: "りんご", tags: ["果物"] },
    { id: "math", count: 2, front: "半径 $r$ の円の面積は？", back: "$\\pi r^2$", tags: ["math"] },
    {
      id: "markdown",
      count: 2,
      front: "学習のコツは？",
      back: "**毎日少しずつ**\n\n- 声に出す\n- 翌日に復習する",
      tags: ["math"],
    },
    {
      id: "deck",
      count: 11,
      front: "What is bisect_left?",
      back: "def my_bisect_left(sl, a):",
      tags: ["py", "binarysearch"],
    },
  ] as const)("downloads all $count $id cards in valid CSV", async ({ id, count, front, back, tags }) => {
    mocks.download.mockClear();
    downloadDeckImportExample(id);
    const [csv, name, mime] = mocks.download.mock.calls[0] as [string, string, string];
    expect(name).toBe(`${id}-sample.csv`);
    expect(mime).toBe("text/csv;charset=utf-8");
    const analysis = await parseCsv(csv);
    expect(analysis.issues).toEqual([]);
    expect(analysis.rows).toHaveLength(count);
    const card = analysis.rows.find((row) => row.card.frontText === front)?.card;
    expect(card?.backText).toContain(back);
    expect(card?.tags).toEqual(tags);
  });
});

import * as Papa from "papaparse";
import type { CardRaw } from "@/entities/card";
import sampleCards from "../../../../sample/build/output.json";

export type DeckImportExampleId = "basic" | "math" | "markdown" | "deck";

interface DeckImportExample {
  id: DeckImportExampleId;
  fileName: string;
  cards: CardRaw[];
  csv: string;
}

const exampleCards: Record<DeckImportExampleId, CardRaw[]> = {
  basic: [
    { frontText: "apple", backText: "りんご", tags: ["果物"], uniqueKey: "apple-001" },
    { frontText: "orange", backText: "オレンジ", tags: ["果物"], uniqueKey: "orange-001" },
    { frontText: "grape", backText: "ぶどう", tags: ["果物"], uniqueKey: "grape-001" },
  ],
  math: [
    { frontText: "半径 $r$ の円の面積は？", backText: "$\\pi r^2$", tags: ["math"], uniqueKey: "circle-area" },
    {
      frontText: "$\\frac{1}{2} + \\frac{1}{4}$ は？",
      backText: "$\\frac{3}{4}$",
      tags: ["math"],
      uniqueKey: "fraction-sum",
    },
  ],
  markdown: [
    {
      frontText: "Markdownで強調するには？",
      backText: "**重要**な語句を強調します。",
      tags: ["md"],
      uniqueKey: "markdown-source",
    },
    {
      frontText: "学習のコツは？",
      backText: "**毎日少しずつ**\n\n- 声に出す\n- 翌日に復習する",
      tags: ["math"],
      uniqueKey: "study-tips",
    },
  ],
  deck: sampleCards,
};

export const deckImportExamples: DeckImportExample[] = (Object.keys(exampleCards) as DeckImportExampleId[]).map(
  (id) => {
    const cards = exampleCards[id];
    return {
      id,
      fileName: `${id}-sample.csv`,
      cards,
      csv: Papa.unparse(
        cards.map((card) => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey]),
        { quotes: true }
      ),
    };
  }
);

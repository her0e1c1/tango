/** @file Verifies migrated application types through their owning module APIs. */

import type { Page, PageKey } from "@/app/routes";
import type { Card, CardNew, CardTextKey } from "@/entities/card";
import type { Deck, DeckNew } from "@/entities/deck";

import { describe, expectTypeOf, it } from "vitest";

describe("application type contracts", () => {
  it("exposes entity creation contracts", () => {
    expectTypeOf<CardNew>().toEqualTypeOf<Omit<Card, "id">>();
    expectTypeOf<DeckNew>().toEqualTypeOf<Omit<Deck, "id">>();
    expectTypeOf<CardTextKey>().toEqualTypeOf<"frontText" | "backText" | "hint">();
  });

  it("exposes routing contracts", () => {
    expectTypeOf<Page>().toEqualTypeOf<{
      top: "/";
      deckList: "/";
      config: "/settings";
      upload: "/import";
    }>();
    expectTypeOf<PageKey>().toEqualTypeOf<"top" | "deckList" | "config" | "upload">();
  });
});

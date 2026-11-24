import { useAsync } from "react-use";
import type { Deck } from "@/entities/deck";
import { bootstrapSampleDeck } from "./bootstrapSampleDeck";

export function useBootstrapSampleDeck(decks: Deck[], loadSample: boolean): void {
  useAsync(bootstrapSampleDeck, [decks, loadSample]);
}

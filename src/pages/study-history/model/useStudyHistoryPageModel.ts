import { useSearchParams } from "react-router-dom";
import { useAuthSession } from "@/entities/auth";
import { useDecks } from "@/entities/deck";
import { getStudyHistoryView } from "./queries/getStudyHistoryView";
import { useStudyHistoryState } from "./useStudyHistoryState";

export function useStudyHistoryPageModel() {
  const [params, setParams] = useSearchParams();
  const deckId = params.get("deckId");
  const auth = useAuthSession();
  const decks = useDecks();
  const history = useStudyHistoryState(auth.status === "authenticated" ? auth.uid : null, deckId);
  const view = getStudyHistoryView(auth, decks, deckId, history);
  return {
    ...view,
    deckId,
    period: history.period,
    retry: history.retry,
    selectDeck: (id: string) => setParams(id === "" ? {} : { deckId: id }),
  };
}

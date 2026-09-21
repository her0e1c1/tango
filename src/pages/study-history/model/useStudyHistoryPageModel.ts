import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/entities/auth";
import { useDecks } from "@/entities/deck";
import { getStudyHistoryView } from "./queries/getStudyHistoryView";
import { useStudyHistoryState } from "./useStudyHistoryState";

export function useStudyHistoryPageModel() {
  const [params, setParams] = useSearchParams();
  const deckId = params.get("deckId");
  const { uid, isAnonymous } = useAuth();
  const decks = useDecks();
  const history = useStudyHistoryState(uid || null, deckId);
  const view = getStudyHistoryView(uid, decks, deckId, history);
  return {
    ...view,
    isAnonymous,
    deckId,
    period: history.period,
    retry: history.retry,
    selectDeck: (id: string) => setParams(id === "" ? {} : { deckId: id }),
  };
}

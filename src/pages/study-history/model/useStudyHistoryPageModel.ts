import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/entities/auth";
import { useDecks } from "@/entities/deck";
import { changeStudyHistoryFilters } from "./actions/changeStudyHistoryFilters";
import { retryStudyHistory } from "./actions/retryStudyHistory";
import { getStudyHistoryRange } from "./queries/getStudyHistoryRange";
import { getStudyHistoryView } from "./queries/getStudyHistoryView";
import { useStudyHistoryFormState } from "./useStudyHistoryFormState";
import { useStudyHistoryState } from "./useStudyHistoryState";
import { useStudyHistoryClock } from "./useStudyHistoryClock";
import { useStudyAnswerHistoryState } from "./useStudyAnswerHistoryState";
import { useLoadStudyAnswers } from "./actions/useLoadStudyAnswers";
import { getStudyAnswerHistoryView } from "./queries/getStudyAnswerHistoryView";

export function useStudyHistoryPageModel() {
  const [params, setParams] = useSearchParams();
  const deckId = params.get("deckId");
  const { uid, isAnonymous } = useAuth();
  const decks = useDecks();
  const { today, setToday } = useStudyHistoryClock(uid, params.toString());
  const range = getStudyHistoryRange(params, today);
  const form = useStudyHistoryFormState(range.fields, range.maxDate);
  const history = useStudyHistoryState(uid || null, deckId, range.period);
  const answers = useStudyAnswerHistoryState(uid || null, deckId, range.period, isAnonymous);
  useLoadStudyAnswers({ request: answers.request, setResult: answers.setResult });
  const answerHistory = getStudyAnswerHistoryView(answers, decks);
  const view = getStudyHistoryView(uid, decks, deckId, history);
  return {
    ...view,
    answerHistory,
    isAnonymous,
    deckId,
    period: history.period,
    range,
    form,
    retry: () => retryStudyHistory(setToday, history.setRetryVersion, answers.setRetryVersion),
    selectDeck: (id: string) => setParams(changeStudyHistoryFilters(params, { deckId: id })),
    selectPeriod: (days: 7 | 30 | 90) => setParams(changeStudyHistoryFilters(params, { days })),
    submitRange: form.handleSubmit((values) => setParams(changeStudyHistoryFilters(params, values))),
  };
}

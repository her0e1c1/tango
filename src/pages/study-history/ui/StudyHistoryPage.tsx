import { useTranslation } from "react-i18next";
import { AppLayout } from "@/widgets/app-layout";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/forms";
import { useStudyHistoryPageModel } from "../model/useStudyHistoryPageModel";
import { StudyHistorySummary } from "./StudyHistorySummary";

export function StudyHistoryPage() {
  const model = useStudyHistoryPageModel();
  const { t, i18n } = useTranslation();
  const formatDate = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });
  return (
    <AppLayout showHeader>
      <h1 className="text-title font-bold text-ink">{t("studyHistory.title")}</h1>
      <p className="text-ink-muted">
        {formatDate.format(model.period.start)} – {formatDate.format(model.period.end - 1)}
      </p>
      <label htmlFor="study-history-deck" className="flex flex-col gap-2 text-ink">
        {t("studyHistory.deck")}
        <Select
          id="study-history-deck"
          value={model.deckId ?? ""}
          onChange={(event) => model.selectDeck(event.target.value)}
          options={[
            ...(model.deckId === "" ? [] : [{ value: "", label: t("studyHistory.allDecks") }]),
            ...(model.deckId !== null && !model.decks.some((deck) => deck.id === model.deckId)
              ? [
                  {
                    value: model.deckId,
                    label: t(model.status === "loading" ? "studyHistory.loading" : "studyHistory.unavailable"),
                  },
                ]
              : []),
            ...model.decks.map((deck) => ({ value: deck.id, label: deck.name })),
          ]}
        />
      </label>
      <p className="text-caption text-ink-muted">{t("studyHistory.countHelp")}</p>
      {model.isAnonymous ? (
        <p className="text-caption text-ink-muted">{t("account.profile.anonymousDataHelp")}</p>
      ) : null}
      {model.status === "loading" && <p role="status">{t("studyHistory.loading")}</p>}
      {model.status === "unavailable" && (
        <div role="status">
          <p>{t("studyHistory.unavailable")}</p>
          <Button onClick={() => model.selectDeck("")}>{t("studyHistory.allDecks")}</Button>
        </div>
      )}
      {model.status === "error" && (
        <div role="alert">
          <p>{t("studyHistory.error")}</p>
          <Button onClick={model.retry}>{t("studyHistory.retry")}</Button>
        </div>
      )}
      {model.summary !== null && (
        <>
          {model.fromCache ? <p className="text-caption text-ink-muted">{t("studyHistory.cacheHelp")}</p> : null}
          <StudyHistorySummary
            days={model.summary.days}
            started={model.summary.started}
            completed={model.summary.completed}
          />
        </>
      )}
    </AppLayout>
  );
}

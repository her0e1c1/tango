import { useTranslation } from "react-i18next";
import { AppLayout } from "@/widgets/app-layout";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/forms";
import { useStudyHistoryPageModel } from "../model/useStudyHistoryPageModel";
import { RecentStudySessions } from "./RecentStudySessions";
import { StudyHistorySummary } from "./StudyHistorySummary";
import { StudyHistoryPeriodPicker } from "./StudyHistoryPeriodPicker";
import { StudyHistoryTable } from "./StudyHistoryTable";

export function StudyHistoryPage() {
  const model = useStudyHistoryPageModel();
  const { t, i18n } = useTranslation();
  const formatDate = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });
  return (
    <AppLayout showHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-title font-bold text-ink">{t("studyHistory.title")}</h1>
            {model.period !== null && (
              <p className="mt-1 text-caption text-ink-muted" aria-live="polite">
                {formatDate.format(model.period.start)} – {formatDate.format(model.period.end - 1)}
              </p>
            )}
          </div>
          <label
            htmlFor="study-history-deck"
            className="flex w-full flex-col gap-1 text-caption text-ink-muted sm:w-56"
          >
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
        </div>
        <StudyHistoryPeriodPicker
          preset={model.range.preset}
          maxDate={model.range.maxDate}
          startDateInput={model.form.register("startDate")}
          endDateInput={model.form.register("endDate")}
          startDateError={model.form.formState.errors.startDate?.message}
          endDateError={model.form.formState.errors.endDate?.message}
          onSelectPeriod={model.selectPeriod}
          onSubmit={model.submitRange}
        />
        {model.isAnonymous ? (
          <p className="text-caption text-ink-muted">{t("account.profile.anonymousDataHelp")}</p>
        ) : null}
        {model.status === "loading" && <p role="status">{t("studyHistory.loading")}</p>}
        {model.status === "invalidRange" && <p role="alert">{t("studyHistory.invalidPeriod")}</p>}
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
        {model.summary !== null && model.chart !== null && (
          <>
            {model.fromCache ? <p className="text-caption text-ink-muted">{t("studyHistory.cacheHelp")}</p> : null}
            <StudyHistorySummary
              chart={model.chart}
              started={model.summary.started}
              completed={model.summary.completed}
            />
            <RecentStudySessions sessions={model.recentSessions} />
            <StudyHistoryTable
              key={`${String(model.period?.start)}-${String(model.period?.end)}`}
              days={model.summary.days}
            />
          </>
        )}
        <p className="text-caption text-ink-muted">{t("studyHistory.countHelp")}</p>
      </div>
    </AppLayout>
  );
}

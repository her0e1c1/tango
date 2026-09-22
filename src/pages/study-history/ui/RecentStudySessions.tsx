import { useTranslation } from "react-i18next";
import { useId, useState } from "react";
import { FiCheckCircle, FiClock, FiMinusCircle } from "react-icons/fi";

interface RecentStudySessionsProps {
  sessions: {
    sessionId: string;
    deckName: string;
    startedAt: number;
    endedAt: number | null;
    cardCount: number;
    endReason: "completed" | "abandoned" | null;
  }[];
}

export function RecentStudySessions({ sessions }: RecentStudySessionsProps) {
  const { t, i18n } = useTranslation();
  const dates = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" });
  const numbers = new Intl.NumberFormat(i18n.language);
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  return (
    <section aria-labelledby="recent-study-sessions" className="min-w-0 text-ink">
      <h2 id="recent-study-sessions" className="font-bold">
        {t("studyHistory.recent")}
      </h2>
      {sessions.length === 0 && <p className="mt-3 text-caption text-ink-muted">{t("studyHistory.noRecent")}</p>}
      <ol id={listId} className="mt-1 divide-y divide-border">
        {(expanded ? sessions : sessions.slice(0, 3)).map((session) => {
          const Icon =
            session.endReason === "completed"
              ? FiCheckCircle
              : session.endReason === "abandoned"
                ? FiMinusCircle
                : FiClock;
          return (
            <li key={session.sessionId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-3">
              <h3 className="min-w-0 break-words font-semibold">{session.deckName}</h3>
              <span
                className={`inline-flex items-center gap-1 self-start text-caption ${session.endReason === "completed" ? "text-success" : "text-ink-muted"}`}
              >
                <Icon aria-hidden />
                {t(`studyHistory.sessionStatus.${session.endReason ?? "unfinished"}`)}
              </span>
              <dl className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
                <div className="flex flex-wrap gap-x-1">
                  <dt>{t("studyHistory.startedAt")}</dt>
                  <dd>{dates.format(session.startedAt)}</dd>
                </div>
                <div className="flex flex-wrap gap-x-1">
                  <dt>{t("studyHistory.endedAt")}</dt>
                  <dd>{session.endedAt === null ? "—" : dates.format(session.endedAt)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>{t("studyHistory.cardCount")}</dt>
                  <dd>{numbers.format(session.cardCount)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
      {sessions.length > 3 && (
        <button
          type="button"
          className="min-h-touch rounded-control border border-border px-3 py-1 text-caption font-semibold hover:bg-surface-muted"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t("studyHistory.showLess") : t("studyHistory.showMore", { count: sessions.length })}
        </button>
      )}
    </section>
  );
}

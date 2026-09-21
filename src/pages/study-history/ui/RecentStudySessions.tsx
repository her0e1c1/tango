import { useTranslation } from "react-i18next";

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
  return (
    <section aria-labelledby="recent-study-sessions" className="min-w-0 text-ink">
      <h2 id="recent-study-sessions" className="font-bold">
        {t("studyHistory.recent")}
      </h2>
      <ol className="mt-3 flex flex-col gap-3">
        {sessions.map((session) => (
          <li key={session.sessionId} className="rounded-surface border border-border bg-surface p-4">
            <h3 className="break-words font-bold">{session.deckName}</h3>
            <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">{t("studyHistory.startedAt")}</dt>
                <dd>{dates.format(session.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("studyHistory.endedAt")}</dt>
                <dd>{session.endedAt === null ? "—" : dates.format(session.endedAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("studyHistory.cardCount")}</dt>
                <dd>{numbers.format(session.cardCount)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{t("studyHistory.status")}</dt>
                <dd>{t(`studyHistory.sessionStatus.${session.endReason ?? "unfinished"}`)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}

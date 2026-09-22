import { useTranslation } from "react-i18next";

interface StudyHistorySummaryProps {
  started: number;
  completed: number;
  chart: {
    buckets: { date: number; endDate: number; started: number; completed: number }[];
    bucketSize: number;
    maximum: number;
    ticks: number[];
  };
}

export function StudyHistorySummary({ started, completed, chart }: StudyHistorySummaryProps) {
  const { t, i18n } = useTranslation();
  const dates = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" });
  const numbers = new Intl.NumberFormat(i18n.language);
  return (
    <>
      <dl className="grid grid-cols-2 divide-x divide-border rounded-surface border border-border bg-surface p-4 text-ink">
        {(["started", "completed"] as const).map((metric) => (
          <div key={metric} className="px-3 sm:px-5">
            <dt className="text-caption text-ink-muted">{t(`studyHistory.${metric}`)}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {numbers.format(metric === "started" ? started : completed)}
            </dd>
          </div>
        ))}
      </dl>
      {started === 0 && completed === 0 && <p role="status">{t("studyHistory.empty")}</p>}
      <figure className="min-w-0 rounded-surface border border-border bg-surface p-4 text-ink sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <figcaption className="font-semibold">
            {chart.bucketSize === 1
              ? t("studyHistory.daily")
              : t("studyHistory.groupedDays", { count: chart.bucketSize })}
          </figcaption>
          <div className="flex flex-wrap gap-4 text-caption text-ink-muted">
            <span>
              <span aria-hidden className="mr-2 inline-block size-2 rounded-sm bg-accent-primary opacity-35" />
              {t("studyHistory.startedShort")}
            </span>
            <span>
              <span aria-hidden className="mr-2 inline-block size-2 rounded-sm bg-accent-primary" />
              {t("studyHistory.completedShort")}
            </span>
          </div>
        </div>
        <div
          className="mt-4 grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-2 gap-y-2"
          role="img"
          aria-label={t("studyHistory.chartHelp")}
        >
          <div aria-hidden className="flex h-24 flex-col justify-between text-caption text-ink-muted">
            <span>{numbers.format(chart.maximum)}</span>
            <span>{numbers.format(chart.maximum / 2)}</span>
            <span>0</span>
          </div>
          <div className="flex h-24 items-end gap-1 border-b border-border">
            {chart.buckets.map((bucket) => (
              <div
                key={bucket.date}
                className="flex h-full min-w-0 flex-1 items-end justify-center gap-px sm:gap-1"
                title={`${dates.format(bucket.date)}${bucket.date === bucket.endDate ? "" : ` – ${dates.format(bucket.endDate)}`}: ${t("studyHistory.startedShort")} ${numbers.format(bucket.started)} / ${t("studyHistory.completedShort")} ${numbers.format(bucket.completed)}`}
              >
                <span
                  className="max-w-3 flex-1 rounded-t-sm bg-accent-primary opacity-35"
                  style={{ height: `${String((bucket.started / chart.maximum) * 100)}%` }}
                />
                <span
                  className="max-w-3 flex-1 rounded-t-sm bg-accent-primary"
                  style={{ height: `${String((bucket.completed / chart.maximum) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="col-start-2 flex justify-between gap-1 text-xs text-ink-muted">
            {chart.ticks.map((date) => (
              <span key={date}>{dates.format(date)}</span>
            ))}
          </div>
        </div>
        <p className="sr-only">{t("studyHistory.scale", { maximum: numbers.format(chart.maximum) })}</p>
      </figure>
    </>
  );
}

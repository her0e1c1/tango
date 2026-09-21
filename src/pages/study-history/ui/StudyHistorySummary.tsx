import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface StudyHistorySummaryProps {
  days: { date: number; started: number; completed: number }[];
  started: number;
  completed: number;
}

export function StudyHistorySummary({ days, started, completed }: StudyHistorySummaryProps) {
  const { t, i18n } = useTranslation();
  const chartRef = useRef<HTMLElement>(null);
  const latestDate = days.at(-1)?.date;
  useEffect(() => {
    // Keep today's bars visible initially on narrow screens; users can scroll back to earlier dates.
    if (chartRef.current) chartRef.current.scrollLeft = chartRef.current.scrollWidth;
  }, [latestDate]);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" });
  const numberFormat = new Intl.NumberFormat(i18n.language);
  const maximum = Math.max(1, ...days.flatMap((day) => [day.started, day.completed]));
  return (
    <>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["started", "completed"] as const).map((metric) => (
          <div key={metric} className="rounded-surface border border-border bg-surface p-4 text-ink">
            <dt>{t(`studyHistory.${metric}`)}</dt>
            <dd className="text-title font-bold">{numberFormat.format(metric === "started" ? started : completed)}</dd>
          </div>
        ))}
      </dl>
      {started === 0 && completed === 0 && <p role="status">{t("studyHistory.empty")}</p>}
      <figure className="min-w-0 rounded-surface border border-border bg-surface p-4 text-ink">
        <figcaption className="font-bold">{t("studyHistory.daily")}</figcaption>
        <div className="my-3 flex flex-wrap gap-4 text-caption">
          <span>
            <span aria-hidden="true" className="mr-2 inline-block size-3 bg-accent-primary" />
            {t("studyHistory.started")}
          </span>
          <span>
            <span aria-hidden="true" className="mr-2 inline-block size-3 border-2 border-accent-primary" />
            {t("studyHistory.completed")}
          </span>
        </div>
        <p className="text-caption text-ink-muted">
          {t("studyHistory.scale", { maximum: numberFormat.format(maximum) })}
        </p>
        <section
          ref={chartRef}
          aria-label={t("studyHistory.chart")}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll all 30 dates horizontally.
          tabIndex={0}
          className="overflow-x-auto focus-visible:ring-2 focus-visible:ring-focus"
        >
          <div className="flex min-w-[960px] gap-2 pt-3" role="img" aria-label={t("studyHistory.chartHelp")}>
            {days.map((day) => (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center">
                <div
                  className="flex h-40 w-full items-end justify-center gap-1 border-b border-border"
                  title={`${dateFormat.format(day.date)}: ${numberFormat.format(day.started)} / ${numberFormat.format(day.completed)}`}
                >
                  <span
                    className="w-2 bg-accent-primary"
                    style={{ height: `${String((day.started / maximum) * 100)}%` }}
                  />
                  <span
                    className="w-2 border-x-2 border-t-2 border-accent-primary"
                    style={{
                      height: `${String((day.completed / maximum) * 100)}%`,
                      borderTopWidth: day.completed === 0 ? 0 : undefined,
                    }}
                  />
                </div>
                <span className="mt-2 text-xs [writing-mode:vertical-rl]">{dateFormat.format(day.date)}</span>
              </div>
            ))}
          </div>
        </section>
      </figure>
      <table className="w-full text-ink">
        <caption className="py-3 text-left font-bold">{t("studyHistory.table")}</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left">
              {t("studyHistory.date")}
            </th>
            <th scope="col" className="p-2 text-right">
              {t("studyHistory.started")}
            </th>
            <th scope="col" className="p-2 text-right">
              {t("studyHistory.completed")}
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date} className="border-t border-border">
              <th scope="row" className="whitespace-nowrap p-2 text-left font-normal">
                {dateFormat.format(day.date)}
              </th>
              <td className="p-2 text-right tabular-nums">{numberFormat.format(day.started)}</td>
              <td className="p-2 text-right tabular-nums">{numberFormat.format(day.completed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

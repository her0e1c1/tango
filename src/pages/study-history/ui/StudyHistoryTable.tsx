import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";

interface StudyHistoryTableProps {
  days: { date: number; started: number; completed: number }[];
}

export function StudyHistoryTable({ days }: StudyHistoryTableProps) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(days.length / 30) - 1);
  const currentPage = Math.min(page, lastPage);
  const offset = currentPage * 30;
  const visible = days.toReversed().slice(offset, offset + 30);
  const dates = new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "short", day: "numeric" });
  const numbers = new Intl.NumberFormat(i18n.language);
  return (
    <details className="border-t border-border pt-3 text-ink">
      <summary className="min-h-touch cursor-pointer py-2 text-caption text-ink-muted">
        {t("studyHistory.showDaily", { count: days.length })}
      </summary>
      <table className="w-full text-caption">
        <caption className="sr-only">{t("studyHistory.table")}</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left">
              {t("studyHistory.date")}
            </th>
            <th scope="col" className="p-2 text-right">
              {t("studyHistory.startedShort")}
            </th>
            <th scope="col" className="p-2 text-right">
              {t("studyHistory.completedShort")}
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((day) => (
            <tr key={day.date} className="border-t border-border">
              <th scope="row" className="p-2 text-left font-normal">
                {dates.format(day.date)}
              </th>
              <td className="p-2 text-right tabular-nums">{numbers.format(day.started)}</td>
              <td className="p-2 text-right tabular-nums">{numbers.format(day.completed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lastPage > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span aria-live="polite" className="text-caption text-ink-muted">
            {t("studyHistory.tablePage", {
              from: numbers.format(offset + 1),
              to: numbers.format(offset + visible.length),
              count: days.length,
            })}
          </span>
          <div className="flex gap-2">
            <Button variant="quiet" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
              {t("studyHistory.newerDays")}
            </Button>
            <Button
              variant="quiet"
              size="sm"
              disabled={currentPage === lastPage}
              onClick={() => setPage(currentPage + 1)}
            >
              {t("studyHistory.olderDays")}
            </Button>
          </div>
        </div>
      )}
    </details>
  );
}

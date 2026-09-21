import { useId } from "react";
import { useTranslation } from "react-i18next";

interface MemoryStateProps {
  memory:
    | {
        at: number;
        start: number;
        end: number;
        lastReviewedAt: number;
        dueAt: number;
        retrievability: number;
        dueRetrievability: number;
        isDue: boolean;
        target: number;
        points: { time: number; probability: number }[];
      }
    | undefined;
}

export function MemoryState({ memory }: MemoryStateProps) {
  const { t, i18n } = useTranslation();
  const id = useId();
  if (memory === undefined) {
    return (
      <section
        aria-label={t("memory.title")}
        className="mt-4 rounded-surface bg-surface-elevated p-4 text-ink shadow-surface"
      >
        <h2 className="text-lg font-semibold">{t("memory.title")}</h2>
        <p className="mt-2">{t("memory.empty")}</p>
      </section>
    );
  }
  const percent = new Intl.NumberFormat(i18n.language, { style: "percent", maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" });
  const { at, start, end, lastReviewedAt, dueAt, retrievability, dueRetrievability, isDue, target, points } = memory;
  const x = (time: number) => 44 + (296 * (time - start)) / (end - start);
  const y = (probability: number) => 204 - 140 * probability;
  const span = end - start;
  const unit = span < 3_600_000 ? "minute" : span < 172_800_000 ? "hour" : "day";
  const divisor = unit === "minute" ? 60_000 : unit === "hour" ? 3_600_000 : 86_400_000;
  const elapsed = new Intl.NumberFormat(i18n.language, {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: 1,
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${String(x(point.time))},${String(y(point.probability))}`)
    .join(" ");
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="mt-4 rounded-surface bg-surface-elevated p-4 text-ink shadow-surface"
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold">
        {t("memory.title")}
      </h2>
      <p className="mt-2">{t("memory.explanation")}</p>
      <p className="mt-3 text-2xl font-semibold">
        {t("memory.retrievability")}: {percent.format(retrievability)}
      </p>
      <p>{t("memory.asOf", { time: date.format(at) })}</p>
      <svg
        viewBox="0 0 360 260"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="mx-auto mt-3 w-full max-w-2xl text-ink"
      >
        <title id={`${id}-title`}>{t("memory.chart")}</title>
        <desc id={`${id}-description`}>
          {t("memory.explanation")} {t("memory.asOf", { time: date.format(at) })}: {percent.format(retrievability)}.{" "}
          {t("memory.nextReview")}: {date.format(dueAt)}, {percent.format(dueRetrievability)}. {t("memory.target")}:{" "}
          {percent.format(target)}.
        </desc>
        {[0, 0.5, 1].map((value) => (
          <g key={value}>
            <line x1="44" x2="340" y1={y(value)} y2={y(value)} stroke="currentColor" opacity="0.2" />
            <text x="39" y={y(value) + 4} textAnchor="end" fontSize="11" fill="currentColor">
              {percent.format(value)}
            </text>
          </g>
        ))}
        <line x1="44" x2="340" y1={y(target)} y2={y(target)} stroke="currentColor" strokeDasharray="5 4" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx={x(lastReviewedAt)} cy={y(1)} r="3" fill="currentColor" />
        <line x1={x(at)} x2={x(at)} y1="24" y2="204" stroke="currentColor" strokeDasharray="2 3" />
        <circle cx={x(at)} cy={y(retrievability)} r="4" fill="currentColor" />
        <text x={Math.min(275, Math.max(90, x(at)))} y="17" textAnchor="middle" fontSize="12" fill="currentColor">
          {t("memory.snapshot")}
        </text>
        <line x1={x(dueAt)} x2={x(dueAt)} y1="48" y2="204" stroke="currentColor" strokeDasharray="7 3" />
        <rect
          x={x(dueAt) - 4}
          y={y(dueRetrievability) - 4}
          width="8"
          height="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <text x={Math.min(275, Math.max(90, x(dueAt)))} y="41" textAnchor="middle" fontSize="12" fill="currentColor">
          {t("memory.nextReview")}
        </text>
        {[start, (start + end) / 2, end].map((time, index) => (
          <text
            key={time}
            x={x(time)}
            y="224"
            textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
            fontSize="11"
            fill="currentColor"
          >
            {elapsed.format((time - lastReviewedAt) / divisor)}
          </text>
        ))}
        <text x="192" y="249" textAnchor="middle" fontSize="12" fill="currentColor">
          {t("memory.elapsed")}
        </text>
      </svg>
      <dl className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="font-semibold">{t("memory.lastReview")}</dt>
          <dd>{date.format(lastReviewedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold">{t("memory.nextReview")}</dt>
          <dd>
            {date.format(dueAt)}
            {isDue ? ` · ${t("memory.due")}` : ""}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">{t("memory.atDue")}</dt>
          <dd>{percent.format(dueRetrievability)}</dd>
        </div>
        <div>
          <dt className="font-semibold">{t("memory.target")}</dt>
          <dd>
            {percent.format(target)} — {t("memory.targetHelp")}
          </dd>
        </div>
      </dl>
    </section>
  );
}

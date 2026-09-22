import { useId, useState, type SubmitEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiCalendar } from "react-icons/fi";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/forms";

interface StudyHistoryPeriodPickerProps {
  preset: 7 | 30 | 90 | "custom";
  maxDate: string;
  startDateInput: UseFormRegisterReturn<"startDate">;
  endDateInput: UseFormRegisterReturn<"endDate">;
  startDateError?: string | undefined;
  endDateError?: string | undefined;
  onSelectPeriod: (days: 7 | 30 | 90) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
}

export function StudyHistoryPeriodPicker(props: StudyHistoryPeriodPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const showFields = expanded || props.preset === "custom";
  const controlClass =
    "min-h-touch rounded-control border px-3 py-2 text-caption focus-visible:ring-2 focus-visible:ring-focus";
  return (
    <section aria-label={t("studyHistory.period")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-caption text-ink-muted">{t("studyHistory.period")}</span>
        <fieldset aria-label={t("studyHistory.period")} className="flex flex-wrap gap-1.5">
          {([7, 30, 90] as const).map((days) => (
            <button
              type="button"
              key={days}
              aria-pressed={props.preset === days}
              className={`${controlClass} ${props.preset === days ? "border-accent-primary bg-surface-muted text-accent-primary" : "border-border text-ink"}`}
              onClick={() => {
                setExpanded(false);
                props.onSelectPeriod(days);
              }}
            >
              {t("studyHistory.presetDays", { count: days })}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={props.preset === "custom"}
            aria-expanded={showFields}
            aria-controls={showFields ? id : undefined}
            className={`${controlClass} inline-flex items-center gap-2 ${props.preset === "custom" ? "border-accent-primary bg-surface-muted text-accent-primary" : "border-border text-ink"}`}
            onClick={() => setExpanded(true)}
          >
            <FiCalendar aria-hidden />
            {t("studyHistory.customPeriod")}
          </button>
        </fieldset>
      </div>
      {showFields ? (
        <form
          id={id}
          onSubmit={(event) => {
            void props.onSubmit(event);
          }}
          noValidate
          className="flex flex-wrap items-start gap-3"
        >
          <div className="flex min-w-0 basis-full flex-col gap-1 text-caption text-ink-muted sm:basis-auto sm:flex-1 sm:max-w-52">
            <label htmlFor={`${id}-start`}>{t("studyHistory.startDate")}</label>
            <Input
              id={`${id}-start`}
              {...props.startDateInput}
              type="date"
              max={props.maxDate}
              aria-invalid={Boolean(props.startDateError)}
              aria-describedby={props.startDateError ? `${id}-start-error` : undefined}
            />
            {props.startDateError ? (
              <span id={`${id}-start-error`} role="alert" className="text-danger">
                {t(props.startDateError)}
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 basis-full flex-col gap-1 text-caption text-ink-muted sm:basis-auto sm:flex-1 sm:max-w-52">
            <label htmlFor={`${id}-end`}>{t("studyHistory.endDate")}</label>
            <Input
              id={`${id}-end`}
              {...props.endDateInput}
              type="date"
              max={props.maxDate}
              aria-invalid={Boolean(props.endDateError)}
              aria-describedby={props.endDateError ? `${id}-end-error` : undefined}
            />
            {props.endDateError ? (
              <span id={`${id}-end-error`} role="alert" className="text-danger">
                {t(props.endDateError)}
              </span>
            ) : null}
          </div>
          <Button type="submit" variant="primary" size="sm" className="sm:mt-6">
            {t("studyHistory.applyPeriod")}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

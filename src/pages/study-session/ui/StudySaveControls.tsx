import { useTranslation } from "react-i18next";

export interface StudySaveControlsProps {
  pending: boolean;
  onSkip: () => void;
}

export function StudySaveControls({ pending, onSkip }: StudySaveControlsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-2">
      {pending ? (
        <p role="status" className="text-caption text-ink-muted">
          {t("studySession.savingAnswer")}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={onSkip}
        className="min-h-touch rounded-control px-3 text-caption font-bold text-accent-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
      >
        {t("studySession.skip")}
      </button>
    </div>
  );
}

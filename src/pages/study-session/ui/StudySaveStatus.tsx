import { useTranslation } from "react-i18next";

export function StudySaveStatus({
  saving,
  unreadable,
  onRetry,
}: {
  saving: boolean;
  unreadable: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-x-4 top-20 z-50 mx-auto max-w-content rounded-surface border border-border bg-surface-elevated p-3 text-center shadow-elevated">
      <p role="status">
        {t(
          saving ? "studySession.saving" : unreadable ? "studySession.pendingUnreadable" : "studySession.pendingReview"
        )}
      </p>
      {!unreadable && (
        <button
          type="button"
          className="mt-2 min-h-touch rounded-control px-4 text-accent-primary"
          disabled={saving}
          onClick={onRetry}
        >
          {t("studySession.retryReview")}
        </button>
      )}
    </div>
  );
}

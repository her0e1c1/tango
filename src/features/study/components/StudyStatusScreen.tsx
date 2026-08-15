import { RouteFeedback } from "@/shared/ui/route-feedback";
import { Button } from "@/shared/ui/button";
import { Layout } from "@/shared/ui/layout";

export const StudyCompletionScreen = ({
  deckName,
  cardCount,
  onRestart,
  onBackToDeck,
}: {
  deckName: string;
  cardCount: number;
  onRestart: () => void;
  onBackToDeck: () => void;
}) => (
  <Layout>
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 text-center text-ink shadow-surface md:p-6">
      <h1 className="text-title font-bold">Study complete</h1>
      <p className="mt-2 text-body font-semibold">{deckName}</p>
      <p className="mt-1 text-body text-ink-muted">Completed {cardCount} cards</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="quiet" onClick={onBackToDeck}>
          Back to deck
        </Button>
        <Button variant="primary" onClick={onRestart}>
          Restart session
        </Button>
      </div>
    </section>
  </Layout>
);

export const StudyUnavailableScreen = ({
  onSetupStudy,
  onBackToDeck,
}: {
  onSetupStudy: () => void;
  onBackToDeck: () => void;
}) => (
  <RouteFeedback
    title="Study session unavailable"
    description="This study session can no longer be continued."
    tone="not-found"
    primaryAction={{ label: "Set up study", onClick: onSetupStudy }}
    secondaryAction={{ label: "Back to deck", onClick: onBackToDeck }}
  />
);

export const StudyVerificationErrorScreen = ({
  retry,
  onBackToDeck,
}: {
  retry: () => void;
  onBackToDeck: () => void;
}) => (
  <RouteFeedback
    title="Unable to verify study session"
    description="The current card could not be checked. Your study session has been preserved."
    tone="error"
    primaryAction={{ label: "Retry", onClick: retry }}
    secondaryAction={{ label: "Back to deck", onClick: onBackToDeck }}
  />
);

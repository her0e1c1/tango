import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useKey, useLatest } from "react-use";

import { CardView, FrontText } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { type StudyState, useStudy } from "../model/useStudy";
import { CardOverlay } from "./CardOverlay";
import { StudyCompletion } from "./StudyCompletion";
import { StudySession } from "./StudySession";

type StudyShortcutAction =
  | "swipeUp"
  | "swipeDown"
  | "swipeLeft"
  | "swipeRight"
  | "toggleBackText"
  | "toggleSwipeButtonList"
  | "toggleAutoPlay";

const isDirectionalStudyAction = (action: StudyShortcutAction): boolean =>
  action === "swipeUp" || action === "swipeDown" || action === "swipeLeft" || action === "swipeRight";

const studyShortcutTextEntryTarget =
  "input:not([type]), input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='password'], input[type='number'], input[type='date'], input[type='datetime-local'], input[type='month'], input[type='time'], input[type='week'], textarea, select";
const studyShortcutButtonTarget =
  "a[href], button, summary, input[type='button'], input[type='submit'], input[type='reset'], input[type='checkbox'], input[type='radio'], [role='button'], [role='link'], [role='switch'], [role='checkbox'], [role='radio'], [role='tab']";
const studyShortcutSliderTarget = "input[type='range'], [role='slider']";
const studyShortcutAnswerScrollTarget = "[data-study-answer-scroll]";

const shouldIgnoreStudyShortcut = (event: KeyboardEvent): boolean => {
  if (!(event.target instanceof Element)) return false;
  if (event.target.closest(studyShortcutTextEntryTarget) !== null) return true;
  const editableTarget = event.target.closest("[contenteditable]");
  if (editableTarget !== null && editableTarget.getAttribute("contenteditable") !== "false") return true;
  if ((event.key === "Enter" || event.key === " ") && event.target.closest(studyShortcutButtonTarget) !== null) {
    return true;
  }
  if (event.key === " " && event.target.closest(studyShortcutAnswerScrollTarget) !== null) return true;
  return event.key.startsWith("Arrow") && event.target.closest(studyShortcutSliderTarget) !== null;
};

interface StudyRecoveryActions {
  exit: () => void;
  returnToSetup: (recover?: () => boolean) => void;
}

type Translate = ReturnType<typeof useTranslation>["t"];

const unavailableCopyKey = {
  "local-missing": "localMissing",
  "remote-missing": "remoteMissing",
  "remote-tombstoned": "remoteTombstoned",
} as const;

const renderStudyScreen = (state: StudyState | undefined, actions: StudyRecoveryActions, t: Translate) => {
  if (state == null) {
    return (
      <RouteFeedback
        title={t("studyRecovery.missingDeck.title")}
        description={t("studyRecovery.missingDeck.description")}
        tone="not-found"
        primaryAction={{ label: t("studyRecovery.backToDeckList"), onClick: actions.exit, autoFocus: true }}
      />
    );
  }

  if (state.status === "verifying") {
    return (
      <RouteFeedback
        title={t("studyRecovery.verifying.title")}
        description={t("studyRecovery.verifying.description")}
        tone="loading"
        secondaryAction={{ label: t("studyRecovery.exit"), onClick: actions.exit }}
      />
    );
  }

  if (state.status === "unavailable") {
    const copyKey = unavailableCopyKey[state.reason];
    return (
      <RouteFeedback
        title={t(`studyRecovery.${copyKey}.title`)}
        description={t(`studyRecovery.${copyKey}.description`)}
        tone="not-found"
        primaryAction={{
          label: t("studyRecovery.backToSetup"),
          onClick: () => actions.returnToSetup(state.recover),
          autoFocus: true,
        }}
      />
    );
  }

  if (state.status === "verification-error") {
    return (
      <RouteFeedback
        key={state.retrying ? "retry-pending" : "retry-ready"}
        title={t("studyRecovery.verificationError.title")}
        description={t("studyRecovery.verificationError.description")}
        tone="error"
        primaryAction={{
          label: t("studyRecovery.retry"),
          onClick: state.retry,
          disabled: state.retrying,
          loading: state.retrying,
          autoFocus: !state.retrying,
        }}
        secondaryAction={{ label: t("studyRecovery.exit"), onClick: actions.exit }}
      />
    );
  }

  if (state.status === "invalid") {
    return (
      <RouteFeedback
        title={t("studyRecovery.invalid.title")}
        description={t("studyRecovery.invalid.description")}
        tone="not-found"
        primaryAction={{
          label: t("studyRecovery.backToSetup"),
          onClick: () => actions.returnToSetup(),
          autoFocus: true,
        }}
      />
    );
  }

  if (state.status === "completed") return null;

  const swipeActions = {
    disabled: false,
    onClickUp: () => void state.swipeUp(),
    onClickDown: () => void state.swipeDown(),
    onClickLeft: () => void state.swipeLeft(),
    onClickRight: () => void state.swipeRight(),
  };

  return (
    <AppLayout fullscreen showHeader={false}>
      <StudySession
        onBack={actions.exit}
        onToggleCardDetails={state.toggleShowCardDetails}
        onToggleHelp={state.toggleShowHelp}
        onToggleSwipeControls={state.toggleSwipeButtonList}
        onTogglePlaybackControls={state.toggleShowPlaybackControls}
        showBackText={state.showBackText}
        showHelp={state.showHelp}
        showCardDetails={state.showCardDetails}
        showSwipeControls={state.showSwipeButtonList}
        showPlaybackControls={state.showPlaybackControls}
        playbackControlsAvailable={state.playbackControlsAvailable}
        help={{
          open: state.help.open,
          triggerLabel: state.help.triggerLabel,
          title: state.help.title,
          description: state.help.description,
          closeLabel: state.help.closeLabel,
          rows: state.help.rows,
          onOpen: state.help.openHelp,
          onClose: state.help.closeHelp,
        }}
        onSwipeUp={swipeActions.onClickUp}
        onSwipeDown={swipeActions.onClickDown}
        onSwipeLeft={swipeActions.onClickLeft}
        onSwipeRight={swipeActions.onClickRight}
        {...(state.showBackTextSwipeOverlays
          ? {
              backTextOverlay: {
                onClickLeft: swipeActions.onClickLeft,
                onClickRight: swipeActions.onClickRight,
              },
            }
          : {})}
        frontTextSlot={
          <FrontText
            category={state.card.category}
            text={state.card.frontText}
            onClick={state.toggleBackText}
            autoFocus={state.focusCard}
          />
        }
        cardOverlaySlot={
          <CardOverlay
            score={state.card.score}
            numberOfSeen={state.card.numberOfSeen}
            {...(state.card.lastSeenAt !== undefined ? { lastSeenAt: state.card.lastSeenAt } : {})}
          />
        }
        backTextSlot={<CardView {...state.card.back} onClick={state.toggleBackText} variant="bare" />}
        controller={{
          autoPlay: state.autoPlay,
          index: state.session.currentIndex,
          numberOfCards: state.session.cardCount,
          onChange: state.updateIndex,
          onToggleAutoPlay: state.toggleAutoPlay,
        }}
        swipeButtonList={swipeActions}
      />
    </AppLayout>
  );
};

const ActiveStudySessionPage: React.FC<{ deckId: string }> = ({ deckId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const study = useStudy(deckId);
  const latestStudy = useLatest(study);
  const exit = () => void navigate(routes.deckList.to());
  const returnToSetup = (recover?: () => boolean) => {
    if (recover !== undefined && !recover()) return;
    void navigate(routes.deckStudyStart.to(deckId), { replace: true });
  };
  const runWhileStudying = (action: StudyShortcutAction) => (event: KeyboardEvent) => {
    // Native editing and activation keys take precedence, while unrelated Study shortcuts remain
    // available after a user moves focus into the card or floating controls.
    const currentStudy = latestStudy.current;
    // A modal Help surface owns every key while open, including keys without native dialog behavior.
    if (currentStudy?.status !== "studying" || currentStudy.help.open || shouldIgnoreStudyShortcut(event)) return;
    // Directional keys are an input gesture, so the answer keeps them inert even though edge overlays can act.
    if (currentStudy.showBackText && isDirectionalStudyAction(action)) return;
    void currentStudy[action]();
  };

  // useKey retains its initial handler, so that handler reads current Page state through one stable ref.
  useKey("ArrowUp", runWhileStudying("swipeUp"));
  useKey("ArrowDown", runWhileStudying("swipeDown"));
  useKey("ArrowLeft", runWhileStudying("swipeLeft"));
  useKey("ArrowRight", runWhileStudying("swipeRight"));
  useKey("Enter", runWhileStudying("toggleBackText"));
  useKey("b", runWhileStudying("toggleSwipeButtonList"));
  useKey(" ", runWhileStudying("toggleAutoPlay"));

  if (study?.status === "completed") {
    return (
      <AppLayout showHeader>
        <StudyCompletion
          cardCount={study.completion.cardCount}
          onClickBack={() => {
            void navigate(routes.deckList.to(), { replace: true });
          }}
        />
      </AppLayout>
    );
  }

  return renderStudyScreen(study, { exit, returnToSetup }, t);
};

export const StudySessionPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  const deck = useDeck(deckId);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) {
    return (
      <RouteFeedback
        title={t("studyRecovery.missingDeck.title")}
        description={t("studyRecovery.missingDeck.description")}
        tone="not-found"
        primaryAction={{
          label: t("studyRecovery.backToDeckList"),
          onClick: () => void navigate(routes.deckList.to(), { replace: true }),
          autoFocus: true,
        }}
      />
    );
  }

  // Study state belongs to one route Deck, so id changes start a fresh Page lifecycle.
  return <ActiveStudySessionPage key={deckId} deckId={deckId} />;
};

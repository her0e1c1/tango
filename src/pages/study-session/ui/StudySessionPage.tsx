import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useKey, useLatest } from "react-use";

import { CardView, FrontText } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import {
  toggleShowHelp,
  toggleShowCardDetails,
  toggleShowPlaybackControls,
  toggleShowSwipeButtonList,
} from "@/entities/preference";
import { DifficultyIndicator } from "@/entities/study-progress";
import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { useStudySessionPageModel } from "../model/useStudySessionPageModel";
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

const ActiveStudySessionPage: React.FC<{ deckId: string }> = ({ deckId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    query,
    pageState,
    toggleBackText,
    toggleAutoPlay,
    openHelp,
    closeHelp,
    changeIndex,
    swipeUp,
    swipeDown,
    swipeLeft,
    swipeRight,
  } = useStudySessionPageModel(deckId);
  const latestShortcuts = useLatest({
    status: query.status,
    helpOpen: pageState.helpOpen,
    showBackText: pageState.showBackText,
    actions: {
      swipeUp,
      swipeDown,
      swipeLeft,
      swipeRight,
      toggleBackText,
      toggleAutoPlay,
      toggleSwipeButtonList: toggleShowSwipeButtonList,
    },
  });
  const goBack = () => void navigate(routes.deckList.to());
  const runWhileStudying = (action: StudyShortcutAction) => (event: KeyboardEvent) => {
    // Native editing and activation keys take precedence, while unrelated Study shortcuts remain
    // available after a user moves focus into the card or floating controls.
    const currentStudy = latestShortcuts.current;
    // A modal Help surface owns every key while open, including keys without native dialog behavior.
    if (currentStudy.status !== "studying" || currentStudy.helpOpen || shouldIgnoreStudyShortcut(event)) return;
    // Directional keys are an input gesture, so the answer keeps them inert even though edge overlays can act.
    if (currentStudy.showBackText && isDirectionalStudyAction(action)) return;
    currentStudy.actions[action]();
  };

  // useKey retains its initial handler, so that handler reads current Page state through one stable ref.
  useKey("ArrowUp", runWhileStudying("swipeUp"));
  useKey("ArrowDown", runWhileStudying("swipeDown"));
  useKey("ArrowLeft", runWhileStudying("swipeLeft"));
  useKey("ArrowRight", runWhileStudying("swipeRight"));
  useKey("Enter", runWhileStudying("toggleBackText"));
  useKey("b", runWhileStudying("toggleSwipeButtonList"));
  useKey(" ", runWhileStudying("toggleAutoPlay"));

  React.useEffect(() => {
    if (query.status !== "invalid" || pageState.completion != null) return;
    void navigate(routes.deckList.to(), { replace: true });
  }, [navigate, query.status, pageState.completion]);

  if (pageState.completion != null) {
    return (
      <AppLayout showHeader>
        <StudyCompletion
          cardCount={pageState.completion.cardCount}
          onClickBack={() => {
            void navigate(routes.deckList.to(), { replace: true });
          }}
        />
      </AppLayout>
    );
  }

  if (query.status !== "studying") {
    return query.status === "preparing" ? (
      <RouteFeedback title={t("studySession.loading")} tone="loading" />
    ) : (
      <RouteFeedback title={t("studySession.unavailable")} tone="not-found" />
    );
  }

  const swipeActions = {
    disabled: false,
    onClickUp: swipeUp,
    onClickDown: swipeDown,
    onClickLeft: swipeLeft,
    onClickRight: swipeRight,
  };

  return (
    <AppLayout fullscreen showHeader={false}>
      <StudySession
        onBack={goBack}
        onToggleCardDetails={toggleShowCardDetails}
        onToggleHelp={toggleShowHelp}
        onToggleSwipeControls={toggleShowSwipeButtonList}
        onTogglePlaybackControls={toggleShowPlaybackControls}
        showBackText={pageState.showBackText}
        showHelp={query.showHelp}
        showCardDetails={query.showCardDetails}
        showSwipeControls={query.showSwipeButtonList}
        showPlaybackControls={query.showPlaybackControls}
        playbackControlsAvailable={query.playbackControlsAvailable}
        help={{
          open: pageState.helpOpen,
          rows: query.helpRows,
          onOpen: openHelp,
          onClose: closeHelp,
        }}
        onSwipeUp={swipeActions.onClickUp}
        onSwipeDown={swipeActions.onClickDown}
        onSwipeLeft={swipeActions.onClickLeft}
        onSwipeRight={swipeActions.onClickRight}
        {...(query.showBackTextSwipeOverlays
          ? {
              backTextOverlay: {
                onClickLeft: swipeActions.onClickLeft,
                onClickRight: swipeActions.onClickRight,
              },
            }
          : {})}
        frontTextSlot={
          <FrontText category={query.card.category} text={query.card.frontText} onClick={toggleBackText} />
        }
        cardOverlaySlot={
          <CardOverlay
            difficultySlot={<DifficultyIndicator difficulty={query.card.difficulty} />}
            numberOfSeen={query.card.numberOfSeen}
            {...(query.card.lastSeenAt !== undefined ? { lastSeenAt: query.card.lastSeenAt } : {})}
          />
        }
        backTextSlot={<CardView {...query.card.back} onClick={toggleBackText} variant="bare" />}
        controller={{
          autoPlay: pageState.autoPlay,
          index: query.session.currentIndex,
          numberOfCards: query.session.cardCount,
          onChange: changeIndex,
          onToggleAutoPlay: toggleAutoPlay,
        }}
        swipeButtonList={swipeActions}
      />
    </AppLayout>
  );
};

export const StudySessionPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  const deck = useDeck(deckId);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) return <RouteFeedback title={t("studySession.unavailable")} tone="not-found" />;

  // Study state belongs to one route Deck, so id changes start a fresh Page lifecycle.
  return <ActiveStudySessionPage key={deckId} deckId={deckId} />;
};

import * as React from "react";
import { AiOutlineArrowDown, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineArrowUp } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useKey, useLatest } from "react-use";

import { CardView, FrontText } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import {
  type SwipeDirection,
  toggleShowHelp,
  toggleShowCardDetails,
  toggleShowPlaybackControls,
  toggleShowSwipeButtonList,
} from "@/entities/preference";
import { DifficultyIndicator } from "@/entities/study-progress";
import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { showToast, type ToastTone } from "@/shared/ui/toast";
import { AppLayout } from "@/widgets/app-layout";

import { useAuthUid } from "@/entities/auth";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useStudyQuery } from "../model/queries/useStudyQuery";
import { useStudyState } from "../model/useStudyState";
import { useStudySessionLifecycle } from "../model/useStudySessionLifecycle";
import { useAutoPlay } from "../model/useAutoPlay";
import { swipeCard } from "../model/actions/swipeCard";
import { updateStudyIndex } from "../model/actions/updateStudyIndex";
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

const swipeFeedbackPresentation = {
  cardSwipeUp: { icon: AiOutlineArrowUp, labelKey: "studySession.feedback.swipedUp" },
  cardSwipeDown: { icon: AiOutlineArrowDown, labelKey: "studySession.feedback.swipedDown" },
  cardSwipeLeft: { icon: AiOutlineArrowLeft, labelKey: "studySession.feedback.swipedLeft" },
  cardSwipeRight: { icon: AiOutlineArrowRight, labelKey: "studySession.feedback.swipedRight" },
} as const satisfies Record<SwipeDirection, { icon: typeof AiOutlineArrowUp; labelKey: string }>;

const SWIPE_FEEDBACK_DURATION_MS = 900;
const SWIPE_FEEDBACK_TONE = "neutral" satisfies ToastTone;

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
  const onSwipeFeedback = (direction: SwipeDirection) => {
    const { icon: Icon, labelKey } = swipeFeedbackPresentation[direction];
    showToast({
      messageKey: labelKey,
      visualContent: (
        <Icon
          aria-hidden="true"
          className="text-3xl"
          data-swipe-feedback-direction={direction}
          data-testid="swipe-feedback-direction"
        />
      ),
      tone: SWIPE_FEEDBACK_TONE,
      durationMs: SWIPE_FEEDBACK_DURATION_MS,
      dismissible: false,
    });
  };
  const uid = useAuthUid();
  const isMounted = useMountedGuard();
  const query = useStudyQuery(deckId);
  const local = useStudyState(query.preferences.study.defaultAutoPlay);
  const hideBackText = () => local.setShowBackText(false);
  useStudySessionLifecycle(deckId, query.sessionState.status);
  useAutoPlay(query.sessionState, {
    autoPlay: local.autoPlay,
    cardInterval: query.preferences.study.cardInterval,
    // Opening Help pauses the timer without changing the user's explicit play/pause choice.
    paused: local.helpOpen,
    onAdvance: hideBackText,
  });
  const swipe = (direction: SwipeDirection) =>
    swipeCard({
      uid,
      deckId,
      cards: query.cards,
      direction,
      swipeAction: query.preferences.controls[direction],
      showFeedback: query.preferences.appearance.showSwipeFeedback,
      hideBodyWhenCardChanged: query.preferences.appearance.hideBodyWhenCardChanged,
      pendingRef: local.swipePendingRef,
      isMounted,
      onCardChanged: hideBackText,
      onCompleted: local.setCompletion,
      onSwipeFeedback,
    });
  const toggleBackText = () => local.setShowBackText((visible) => !visible);
  const toggleAutoPlay = () => local.setAutoPlay((playing) => !playing);
  const latestShortcuts = useLatest({
    status: query.status,
    helpOpen: local.helpOpen,
    showBackText: local.showBackText,
    actions: {
      swipeUp: () => swipe("cardSwipeUp"),
      swipeDown: () => swipe("cardSwipeDown"),
      swipeLeft: () => swipe("cardSwipeLeft"),
      swipeRight: () => swipe("cardSwipeRight"),
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
    void currentStudy.actions[action]();
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
    if (query.status !== "invalid" || local.completion != null) return;
    void navigate(routes.deckList.to(), { replace: true });
  }, [navigate, query.status, local.completion]);

  if (local.completion != null) {
    return (
      <AppLayout showHeader>
        <StudyCompletion
          cardCount={local.completion.cardCount}
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
    onClickUp: () => void swipe("cardSwipeUp"),
    onClickDown: () => void swipe("cardSwipeDown"),
    onClickLeft: () => void swipe("cardSwipeLeft"),
    onClickRight: () => void swipe("cardSwipeRight"),
  };

  return (
    <AppLayout fullscreen showHeader={false}>
      <StudySession
        onBack={goBack}
        onToggleCardDetails={toggleShowCardDetails}
        onToggleHelp={toggleShowHelp}
        onToggleSwipeControls={toggleShowSwipeButtonList}
        onTogglePlaybackControls={toggleShowPlaybackControls}
        showBackText={local.showBackText}
        showHelp={query.showHelp}
        showCardDetails={query.showCardDetails}
        showSwipeControls={query.showSwipeButtonList}
        showPlaybackControls={query.showPlaybackControls}
        playbackControlsAvailable={query.playbackControlsAvailable}
        help={{
          open: local.helpOpen,
          rows: query.helpRows,
          onOpen: () => local.setHelpOpen(true),
          onClose: () => local.setHelpOpen(false),
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
          autoPlay: local.autoPlay,
          index: query.session.currentIndex,
          numberOfCards: query.session.cardCount,
          onChange: (index) => updateStudyIndex(deckId, index, hideBackText),
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

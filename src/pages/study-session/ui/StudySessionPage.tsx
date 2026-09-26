import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { CardView, FrontText } from "@/entities/card";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { useStudySessionPageModel } from "../model/useStudySessionPageModel";
import { CardPlayer, CardOverlay } from "@/features/card-player";
import { useStudySessionRouteModel } from "../model/useStudySessionRouteModel";
import { StudySaveControls } from "./StudySaveControls";
import { StudyCompletion } from "./StudyCompletion";

const StudySessionContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const { t } = useTranslation();
  const model = useStudySessionPageModel(deckId);
  const { query, pageState } = model;

  if (pageState.completion != null) {
    return (
      <AppLayout showHeader>
        <StudyCompletion cardCount={pageState.completion.cardCount} onClickBack={model.finish} />
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

  const blocked = pageState.swipePending;
  const swipeActions = getSwipeActions(query.swipeActions, model, blocked, t);

  return (
    <AppLayout fullscreen showHeader={false}>
      <CardPlayer
        {...getStudyPlayerControls({ ...model, query })}
        cardKey={query.card.id}
        showBackText={pageState.showBackText}
        onSwipeUp={swipeActions.onClickUp}
        onSwipeDown={swipeActions.onClickDown}
        onSwipeLeft={swipeActions.onClickLeft}
        onSwipeRight={swipeActions.onClickRight}
        {...(query.showBackTextSwipeOverlays && !blocked
          ? {
              backTextOverlay: {
                onClickLeft: swipeActions.onClickLeft,
                onClickRight: swipeActions.onClickRight,
              },
            }
          : {})}
        frontTextSlot={
          <FrontText
            viewMode={query.viewMode}
            category={query.card.category}
            text={query.card.frontText}
            onClick={model.toggleBackText}
          />
        }
        cardOverlaySlot={<CardOverlay fsrs={query.card.fsrs} />}
        backTextSlot={<CardView {...query.card.back} onClick={model.toggleBackText} variant="bare" />}
        actionSlot={
          (!pageState.showBackText || blocked) && (pageState.swipePending || query.showSkip) ? (
            <StudySaveControls pending={pageState.swipePending} showSkip={query.showSkip} onSkip={model.skip} />
          ) : undefined
        }
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

  const deck = useStudySessionRouteModel(deckId);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) return <RouteFeedback title={t("studySession.unavailable")} tone="not-found" />;

  // Study state belongs to one route Deck, so id changes start a fresh Page lifecycle.
  return <StudySessionContainer key={deckId} deckId={deckId} />;
};

interface StudyPlayerControls {
  pageState: { helpOpen: boolean; autoPlay: boolean; swipePending: boolean };
  openHelp: () => void;
  closeHelp: () => void;
  changeIndex: (index: number) => void;
  toggleAutoPlay: () => void;

  query: {
    session: { currentIndex: number; cardCount: number };
    helpRows: import("@/features/card-player").CardPlayerProps["help"]["rows"];
    viewMode: boolean;
    showViewMode: boolean;
    showHelp: boolean;
    showCardDetails: boolean;
    showSwipeButtonList: boolean;
    showPlaybackControls: boolean;
    showSkip: boolean;
    playbackControlsAvailable: boolean;
  };
  toggleViewMode: () => void;
  goBack: () => void;
  toggleShowCardDetails: () => void;
  toggleShowHelp: () => void;
  toggleShowSwipeButtonList: () => void;
  toggleShowPlaybackControls: () => void;
  toggleShowSkip: () => void;
  toggleShowViewMode: () => void;
}

function getStudyPlayerControls(model: StudyPlayerControls) {
  return {
    help: {
      open: model.pageState.helpOpen,
      rows: model.query.helpRows,
      onOpen: model.openHelp,
      onClose: model.closeHelp,
    },
    controller: {
      disabled: model.pageState.swipePending,
      autoPlay: model.pageState.autoPlay,
      index: model.query.session.currentIndex,
      numberOfCards: model.query.session.cardCount,
      onChange: model.changeIndex,
      onToggleAutoPlay: model.toggleAutoPlay,
    },

    viewMode: model.query.viewMode,
    onToggleViewMode: model.toggleViewMode,
    onBack: model.goBack,
    onToggleCardDetails: model.toggleShowCardDetails,
    onToggleHelp: model.toggleShowHelp,
    onToggleSwipeControls: model.toggleShowSwipeButtonList,
    onTogglePlaybackControls: model.toggleShowPlaybackControls,
    onToggleSkipControls: model.toggleShowSkip,
    showViewMode: model.query.showViewMode,
    onToggleShowViewMode: model.toggleShowViewMode,
    showHelp: model.query.showHelp,
    showCardDetails: model.query.showCardDetails,
    showSwipeControls: model.query.showSwipeButtonList,
    showPlaybackControls: model.query.showPlaybackControls,
    showSkipControls: model.query.showSkip,
    playbackControlsAvailable: model.query.playbackControlsAvailable,
  };
}

function getSwipeActions(
  actions: import("@/entities/preference").Preferences["controls"],
  model: { swipeUp: () => void; swipeDown: () => void; swipeLeft: () => void; swipeRight: () => void },
  blocked: boolean,
  t: import("i18next").TFunction
) {
  return {
    disabled: blocked,
    captions: {
      cardSwipeUp: t(`studySession.actionLabels.${actions.cardSwipeUp}`),
      cardSwipeDown: t(`studySession.actionLabels.${actions.cardSwipeDown}`),
      cardSwipeLeft: t(`studySession.actionLabels.${actions.cardSwipeLeft}`),
      cardSwipeRight: t(`studySession.actionLabels.${actions.cardSwipeRight}`),
    },
    onClickUp: model.swipeUp,
    onClickDown: model.swipeDown,
    onClickLeft: model.swipeLeft,
    onClickRight: model.swipeRight,
  };
}

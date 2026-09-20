import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { CardView, FrontText } from "@/entities/card";
import { DifficultyIndicator } from "@/entities/study-progress";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { useStudySessionPageModel } from "../model/useStudySessionPageModel";
import { CardPlayer, CardOverlay } from "@/features/card-player";
import { useStudySessionRouteModel } from "../model/useStudySessionRouteModel";
import { StudyCompletion } from "./StudyCompletion";

const StudySessionContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const { t } = useTranslation();
  const {
    goBack,
    finish,
    toggleShowHelp,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleShowSwipeButtonList,
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

  if (pageState.completion != null) {
    return (
      <AppLayout showHeader>
        <StudyCompletion cardCount={pageState.completion.cardCount} onClickBack={finish} />
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
    disabledDirections: query.disabledSwipeDirections,
    onClickUp: swipeUp,
    onClickDown: swipeDown,
    onClickLeft: swipeLeft,
    onClickRight: swipeRight,
  };

  return (
    <AppLayout fullscreen showHeader={false}>
      <CardPlayer
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
                ...(!query.disabledSwipeDirections.cardSwipeLeft ? { onClickLeft: swipeActions.onClickLeft } : {}),
                ...(!query.disabledSwipeDirections.cardSwipeRight ? { onClickRight: swipeActions.onClickRight } : {}),
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
  const { deckId, deck } = useStudySessionRouteModel(params.id);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) return <RouteFeedback title={t("studySession.unavailable")} tone="not-found" />;

  // Study state belongs to one route Deck, so id changes start a fresh Page lifecycle.
  return <StudySessionContainer key={deckId} deckId={deckId} />;
};

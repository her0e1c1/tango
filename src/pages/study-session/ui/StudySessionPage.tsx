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
  const {
    goBack,
    finish,
    toggleViewMode,
    toggleShowHelp,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleShowSkip,
    toggleShowSwipeButtonList,
    query,
    pageState,
    toggleBackText,
    toggleAutoPlay,
    openHelp,
    closeHelp,
    changeIndex,
    skip,
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

  const blocked = pageState.swipePending;
  const swipeActions = {
    disabled: blocked,
    captions: {
      cardSwipeUp: t(`studySession.actionLabels.${query.swipeActions.cardSwipeUp}`),
      cardSwipeDown: t(`studySession.actionLabels.${query.swipeActions.cardSwipeDown}`),
      cardSwipeLeft: t(`studySession.actionLabels.${query.swipeActions.cardSwipeLeft}`),
      cardSwipeRight: t(`studySession.actionLabels.${query.swipeActions.cardSwipeRight}`),
    },
    onClickUp: swipeUp,
    onClickDown: swipeDown,
    onClickLeft: swipeLeft,
    onClickRight: swipeRight,
  };

  return (
    <AppLayout fullscreen showHeader={false}>
      <CardPlayer
        cardKey={query.card.id}
        viewMode={query.viewMode}
        onToggleViewMode={toggleViewMode}
        onBack={goBack}
        onToggleCardDetails={toggleShowCardDetails}
        onToggleHelp={toggleShowHelp}
        onToggleSwipeControls={toggleShowSwipeButtonList}
        onTogglePlaybackControls={toggleShowPlaybackControls}
        onToggleSkipControls={toggleShowSkip}
        showBackText={pageState.showBackText}
        showHelp={query.showHelp}
        showCardDetails={query.showCardDetails}
        showSwipeControls={query.showSwipeButtonList}
        showPlaybackControls={query.showPlaybackControls}
        showSkipControls={query.showSkip}
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
            onClick={toggleBackText}
          />
        }
        cardOverlaySlot={<CardOverlay fsrs={query.card.fsrs} />}
        backTextSlot={<CardView {...query.card.back} onClick={toggleBackText} variant="bare" />}
        actionSlot={
          (!pageState.showBackText || blocked) && (pageState.swipePending || query.showSkip) ? (
            <StudySaveControls pending={pageState.swipePending} showSkip={query.showSkip} onSkip={skip} />
          ) : undefined
        }
        controller={{
          disabled: blocked,
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

  const deck = useStudySessionRouteModel(deckId);

  // Study lifecycle mutates session state, so an unavailable route Deck must not mount it.
  if (deck == null) return <RouteFeedback title={t("studySession.unavailable")} tone="not-found" />;

  // Study state belongs to one route Deck, so id changes start a fresh Page lifecycle.
  return <StudySessionContainer key={deckId} deckId={deckId} />;
};

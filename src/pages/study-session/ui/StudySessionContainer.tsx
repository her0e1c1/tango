import type * as React from "react";
import { useTranslation } from "react-i18next";

import { CardView, FrontText } from "@/entities/card";
import { DifficultyIndicator } from "@/entities/study-progress";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { useStudySessionPageModel } from "../model/useStudySessionPageModel";
import { CardOverlay } from "./CardOverlay";
import { StudyCompletion } from "./StudyCompletion";
import { StudySession } from "./StudySession";

export const StudySessionContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const { t } = useTranslation();
  const {
    query,
    pageState,
    goBack,
    finish,
    toggleShowHelp,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleShowSwipeButtonList,
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

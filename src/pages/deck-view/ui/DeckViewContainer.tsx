import { useTranslation } from "react-i18next";
import { BackText, FrontText } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { DifficultyIndicator } from "@/entities/study-progress";
import { CardPlayer, CardOverlay } from "@/features/card-player";
import { AppLayout } from "@/widgets/app-layout";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { useDeckViewPageModel } from "../model/useDeckViewPageModel";

export function DeckViewContainer({ deck }: { deck: Deck }) {
  const { t } = useTranslation();
  const model = useDeckViewPageModel(deck);
  if (model.card === undefined)
    return (
      <RouteFeedback title={t("deckView.empty")} primaryAction={{ label: t("deckView.back"), onClick: model.back }} />
    );
  return (
    <AppLayout fullscreen showHeader={false} scroll={false}>
      <CardPlayer
        cardKey={model.card.id}
        allowBackHorizontalSwipe
        answerLabel={t("deckView.answerAria")}
        onAnswerClick={model.flip}
        showBackText={model.showBackText}
        showHelp={model.controls.showHelp}
        showCardDetails={model.controls.showCardDetails}
        showSwipeControls={model.controls.showSwipeButtonList}
        showPlaybackControls={model.controls.showPlaybackControls}
        playbackControlsAvailable={model.playbackAvailable}
        onBack={model.back}
        onToggleHelp={model.toggleShowHelp}
        onToggleCardDetails={model.toggleShowCardDetails}
        onToggleSwipeControls={model.toggleShowSwipeButtonList}
        onTogglePlaybackControls={model.toggleShowPlaybackControls}
        onSwipeLeft={model.previous}
        onSwipeRight={model.next}
        help={{
          open: model.helpOpen,
          rows: model.helpRows,
          onOpen: model.openHelp,
          onClose: model.closeHelp,
          triggerLabel: t("deckView.helpTrigger"),
          title: t("deckView.helpTitle"),
          description: t("deckView.helpDescription"),
        }}
        frontTextSlot={
          <FrontText
            text={model.card.frontText}
            category={model.category}
            ariaLabel={t("deckView.frontAria")}
            onClick={model.flip}
          />
        }
        backTextSlot={
          <BackText text={model.card.backText} category={model.category} code={model.code} dark={model.dark} />
        }
        cardOverlaySlot={
          <CardOverlay
            difficultySlot={<DifficultyIndicator difficulty={model.card.difficulty} />}
            numberOfSeen={model.card.numberOfSeen}
            {...(model.card.lastSeenAt !== undefined ? { lastSeenAt: model.card.lastSeenAt } : {})}
          />
        }
        controller={{
          autoPlay: model.autoPlay,
          index: model.index,
          numberOfCards: model.total,
          onChange: model.changeIndex,
          onToggleAutoPlay: model.toggleAutoPlay,
          progressLabel: t("deckView.progress"),
        }}
        swipeButtonList={{
          disabledDirections: { cardSwipeUp: true, cardSwipeDown: true },
          onClickLeft: model.previous,
          onClickRight: model.next,
          labels: { cardSwipeLeft: t("deckView.previous"), cardSwipeRight: t("deckView.next") },
        }}
      />
    </AppLayout>
  );
}

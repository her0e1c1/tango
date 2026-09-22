import { useTranslation } from "react-i18next";
import { AiOutlineEdit } from "react-icons/ai";
import { Link, useParams } from "react-router-dom";

import { BackText, FrontText } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { CardPlayer, CardOverlay } from "@/features/card-player";
import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckViewPageModel } from "../model/useDeckViewPageModel";
import { useDeckViewRouteModel } from "../model/useDeckViewRouteModel";

function DeckViewContainer({ deck }: { deck: Deck }) {
  const { t } = useTranslation();
  const model = useDeckViewPageModel(deck);
  if (model.card === undefined)
    return (
      <RouteFeedback title={t("deckView.empty")} primaryAction={{ label: t("deckView.back"), onClick: model.back }} />
    );
  return (
    <AppLayout fullscreen showHeader={false} scroll={false}>
      <CardPlayer
        viewMode={model.controls.viewMode}
        onToggleViewMode={model.toggleViewMode}
        cardKey={model.card.id}
        allowBackHorizontalSwipe
        answerLabel={t("deckView.answerAria")}
        onAnswerClick={model.flip}
        showBackText={model.showBackText}
        editLink={{
          visible: model.controls.showEditLink,
          onToggle: model.toggleShowEditLink,
          element: (
            <Link
              to={routes.cardForm.to(model.card.id)}
              aria-label={t("cardForm.edit.title")}
              title={t("cardForm.edit.title")}
              className="pointer-events-auto inline-flex size-touch shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <AiOutlineEdit aria-hidden="true" className="text-xl" />
            </Link>
          ),
        }}
        showViewMode={model.controls.showViewMode}
        onToggleShowViewMode={model.toggleShowViewMode}
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
            viewMode={model.controls.viewMode}
            text={model.card.frontText}
            category={model.category}
            ariaLabel={t("deckView.frontAria")}
            onClick={model.flip}
          />
        }
        backTextSlot={
          <BackText text={model.card.backText} category={model.category} code={model.code} dark={model.dark} />
        }
        cardOverlaySlot={<CardOverlay fsrs={model.card.fsrs} />}
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

export function DeckViewPage() {
  const { t } = useTranslation();
  const params = useParams();
  const model = useDeckViewRouteModel(params.id);
  if (model.deck === undefined) {
    return (
      <RouteNotFound title={t("cardList.deckNotFound.title")} description={t("cardList.deckNotFound.description")} />
    );
  }
  return <DeckViewContainer key={model.ownerKey} deck={model.deck} />;
}

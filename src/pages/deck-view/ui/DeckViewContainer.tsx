import { BackText, FrontText } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { AppLayout } from "@/widgets/app-layout";
import { useDeckViewPageModel } from "../model/useDeckViewPageModel";
import { DeckView } from "./DeckView";

export function DeckViewContainer({ deck }: { deck: Deck }) {
  const model = useDeckViewPageModel(deck);
  return (
    <AppLayout fullscreen showHeader={false} scroll={false}>
      <DeckView
        deckName={model.deckName}
        current={model.current}
        total={model.total}
        showBackText={model.showBackText}
        onBack={model.back}
        onPrevious={model.previous}
        onNext={model.next}
        onFlip={model.flip}
        front={model.card && <FrontText text={model.card.frontText} category={model.category} />}
        back={
          model.card && (
            <BackText text={model.card.backText} category={model.category} code={model.code} dark={model.dark} />
          )
        }
      />
    </AppLayout>
  );
}

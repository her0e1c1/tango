import { useTranslation } from "react-i18next";
import { useDeckViewRouteModel } from "../model/useDeckViewRouteModel";
import { RouteNotFound } from "@/widgets/route-not-found";
import { DeckViewContainer } from "./DeckViewContainer";

export function DeckViewPage() {
  const { t } = useTranslation();
  const model = useDeckViewRouteModel();
  if (model.deck === undefined) {
    return (
      <RouteNotFound title={t("cardList.deckNotFound.title")} description={t("cardList.deckNotFound.description")} />
    );
  }
  return <DeckViewContainer key={model.ownerKey} deck={model.deck} />;
}

import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as action from "@/action";

export const useActions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      goToView: (id: DeckId) => {
        void navigate(`/deck/${id}`);
      },
      goToStart: (id: DeckId) => {
        void navigate(`/deck/${id}/start`);
      },
      goToEdit: (id: DeckId) => {
        void navigate(`/deck/${id}/edit`);
      },
      goToStudy: (id: DeckId) => {
        void navigate(`/deck/${id}/study`);
      },
      goToCardView: (id: CardId) => {
        void navigate(`/card/${id}`);
      },
      goToCardEdit: (id: CardId) => {
        void navigate(`/card/${id}/edit`);
      },
      goToTop: () => {
        void navigate("/");
      },
      goToSettings: () => {
        void navigate("/settings");
      },
      goToImport: () => {
        void navigate("/import");
      },
      goByMenu: (key: PageKey) => {
        if (key === "config") {
          void navigate("/settings");
        } else if (key === "upload") {
          void navigate("/import");
        } else {
          void navigate("/");
        }
      },
      deckDownload: (id: DeckId) => dispatch(action.deck.download(id)),
      deckRemove: (id: DeckId) =>
        window.confirm("Are you sure of removing this deck?") && dispatch(action.deck.remove(id)),
      deckReimport: (id: DeckId) =>
        window.confirm("Are you sure of reloading this deck?") && dispatch(action.deck.reimport(id)),
      deckUploadAndBack: (file: File) => {
        dispatch(action.deck.parseFile(file));
        void navigate(-1);
      },
      deckDownloadCsvSampleText: () => {
        dispatch(action.deck.downloadCsvSampleText());
      },
      cardUpdate: (card: Card) => dispatch(action.card.update(card)),
      cardUpdateBy: (f: (c: Card) => Partial<Card>) => (id: CardId) => dispatch(action.card.updateBy(id, f)),
      cardUpdateAndBack: (card: Card) => {
        dispatch(action.card.update(card));
        void navigate(-1);
      },
      cardRemove: (id: CardId) => window.confirm("Are you sure?") && dispatch(action.card.remove(id)),
      login: () => dispatch(action.config.loginGoogle()),
      logout: () => dispatch(action.config.logout()),
      configUpdate: (config: ConfigState) => dispatch(action.config.updateAll(config)),
      setDarkMode: (darkMode: boolean) => dispatch(action.config.update("darkMode", darkMode)),
      toggleShowHeader: () => dispatch(action.config.toggle("showHeader")),
      toggleShowSwipeButtonList: () => dispatch(action.config.toggle("showSwipeButtonList")),
    }),
    [dispatch, navigate]
  );
};

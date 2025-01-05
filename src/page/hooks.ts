import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as action from "src/action";

export const useActions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      goToView: (id: DeckId) => {
        navigate(`/deck/${id}`);
      },
      goToStart: (id: DeckId) => {
        navigate(`/deck/${id}/start`);
      },
      goToEdit: (id: DeckId) => {
        navigate(`/deck/${id}/edit`);
      },
      goToStudy: (id: DeckId) => {
        navigate(`/deck/${id}/study`);
      },
      goToCardView: (id: CardId) => {
        navigate(`/card/${id}`);
      },
      goToCardEdit: (id: CardId) => {
        navigate(`/card/${id}/edit`);
      },
      goToTop: () => {
        navigate("/");
      },
      goToSettings: () => {
        navigate("/settings");
      },
      goToImport: () => {
        navigate("/import");
      },
      goByMenu: (key: PageKey) => {
        if (key === "config") {
          navigate("/settings");
        } else if (key === "upload") {
          navigate("/import");
        } else {
          navigate("/");
        }
      },
      deckDownload: (id: DeckId) => dispatch(action.deck.download(id)),
      deckRemove: (id: DeckId) =>
        window.confirm("Are you sure of removing this deck?") && dispatch(action.deck.remove(id)),
      deckReimport: (id: DeckId) =>
        window.confirm("Are you sure of reloading this deck?") && dispatch(action.deck.reimport(id)),
      deckUploadAndBack: (file: File) => {
        dispatch(action.deck.parseFile(file));
        navigate(-1);
      },
      deckDownloadCsvSampleText: () => {
        dispatch(action.deck.downloadCsvSampleText());
      },
      cardUpdate: (card: Card) => dispatch(action.card.update(card)),
      cardUpdateBy: (f: (c: Card) => Partial<Card>) => (id: CardId) => dispatch(action.card.updateBy(id, f)),
      cardUpdateAndBack: (card: Card) => {
        dispatch(action.card.update(card));
        navigate(-1);
      },
      cardRemove: (id: CardId) => window.confirm("Are you sure?") && dispatch(action.card.remove(id)),
      login: () => dispatch(action.config.loginGoogle()),
      logout: () => dispatch(action.config.logout()),
      configUpdate: (config: ConfigState) => dispatch(action.config.updateAll(config)),
      setDarkMode: (darkMode: boolean) => dispatch(action.config.update("darkMode", darkMode)),
      toggleShowBackText: () => dispatch(action.config.toggle("showBackText")),
      toggleShowHeader: () => dispatch(action.config.toggle("showHeader")),
      toggleShowSwipeButtonList: () => dispatch(action.config.toggle("showSwipeButtonList")),
      toggleAutoPlay: () => dispatch(action.config.toggle("autoPlay")),
    }),
    [dispatch, navigate]
  );
};

export const useDeckActions = (id: DeckId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      swipeUp: () => {
        dispatch(action.deck.swipe("cardSwipeUp", id));
      },
      swipeDown: () => {
        dispatch(action.deck.swipe("cardSwipeDown", id));
      },
      swipeLeft: () => {
        dispatch(action.deck.swipe("cardSwipeLeft", id));
      },
      swipeRight: () => {
        dispatch(action.deck.swipe("cardSwipeRight", id));
      },
      update: (deck: Deck) => {
        dispatch(action.deck.update(deck));
      },
      updateAndBack: (deck: Deck) => {
        dispatch(action.deck.update(deck));
        navigate(-1);
      },
      remove: () => dispatch(action.deck.remove(id)),
      start: async () => {
        await dispatch(action.deck.start(id));
        await navigate(`/deck/${id}/study`, { replace: true }); // need to wait for cardOrderIds to be updated
      },
      updateIndex: (currentIndex: number) => {
        // first update config because currentIndex may become out of index
        dispatch(action.config.update("showBackText", false));
        dispatch(action.deck.update({ id, currentIndex }));
      },
    }),
    [dispatch, navigate, id]
  );
};

import { useNavigate } from "react-router-dom";
import * as action from "@/action";
import { configStore } from "@/store/configStore";

export const useActions = () => {
  const navigate = useNavigate();
  return {
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
    deckDownloadCsvSampleText: () => {
      action.deck.downloadCsvSampleText();
    },
    login: action.event.loginGoogle,
    logout: action.event.logout,
    configUpdate: (config: ConfigState) => configStore.getState().updateConfig(config),
    setDarkMode: (darkMode: boolean) => configStore.getState().updateConfig({ darkMode }),
    toggleShowHeader: () => configStore.getState().toggleConfig("showHeader"),
    toggleShowSwipeButtonList: () => configStore.getState().toggleConfig("showSwipeButtonList"),
  };
};

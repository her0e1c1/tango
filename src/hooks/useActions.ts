/**
 * @file Provides the application-wide Use Actions React hook.
 * It gives components a focused view of shared state and operations without exposing the
 * underlying store setup.
 */

import { useNavigate } from "react-router-dom";
import * as action from "@/action";
import { configStore } from "@/store/configStore";

/**
 * Provides application navigation and cross-feature actions to React components.
 * Components call these named operations without constructing route URLs or reaching into domain
 * modules directly.
 */
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

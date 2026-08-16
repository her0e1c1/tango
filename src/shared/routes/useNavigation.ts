import type { NavigateFunction, NavigateOptions } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { routes } from "./routes";

const navigateTo = (
  navigate: NavigateFunction,
  destination: string,
  options?: NavigateOptions
): ReturnType<NavigateFunction> => (options === undefined ? navigate(destination) : navigate(destination, options));

export const useNavigation = () => {
  const navigate = useNavigate();

  return {
    goBack: () => navigate(-1),
    goToDeckList: (options?: NavigateOptions) => navigateTo(navigate, routes.deckList.to(), options),
    goToCardList: (id: string, options?: NavigateOptions) => navigateTo(navigate, routes.cardList.to(id), options),
    goToDeckForm: (id: string, options?: NavigateOptions) => navigateTo(navigate, routes.deckForm.to(id), options),
    goToDeckStudyStart: (id: string, options?: NavigateOptions) =>
      navigateTo(navigate, routes.deckStudyStart.to(id), options),
    goToDeckStudy: (id: string, options?: NavigateOptions) => navigateTo(navigate, routes.deckStudy.to(id), options),
    goToCardView: (id: string, options?: NavigateOptions) => navigateTo(navigate, routes.cardView.to(id), options),
    goToCardForm: (id: string, options?: NavigateOptions) => navigateTo(navigate, routes.cardForm.to(id), options),
    goToSettings: (options?: NavigateOptions) => navigateTo(navigate, routes.settings.to(), options),
    goToDeckImport: (options?: NavigateOptions) => navigateTo(navigate, routes.deckImport.to(), options),
  };
};

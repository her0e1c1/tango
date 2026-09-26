import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import { routes } from "@/shared/router";

export function useCardListShortcuts(dialogOpen: boolean) {
  const navigate = useNavigate();
  const goToDeckList = () => {
    if (!dialogOpen) void navigate(routes.deckList.to());
  };
  const goToSettings = () => {
    if (!dialogOpen) void navigate(routes.settings.to());
  };
  useKey("t", goToDeckList, undefined, [goToDeckList]);
  useKey("s", goToSettings, undefined, [goToSettings]);
}

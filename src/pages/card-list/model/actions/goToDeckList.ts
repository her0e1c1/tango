import type { NavigateFunction } from "react-router-dom";
import { routes } from "@/shared/router";

export function goToDeckList(navigate: NavigateFunction, dialogOpen: boolean): void {
  if (!dialogOpen) void navigate(routes.deckList.to());
}

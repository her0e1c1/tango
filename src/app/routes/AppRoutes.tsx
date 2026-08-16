/**
 * @file Defines Tango's route tree.
 * Each URL is connected to a page component while route-level authentication actions and unknown
 * route recovery stay at the application boundary.
 */

import type React from "react";
import { Route, Routes } from "react-router-dom";

import { loginGoogle } from "@/features/sign-in";
import { signOutCurrentUser } from "@/features/sign-out";
import { CardFormPage } from "@/pages/card-form";
import { CardListPage } from "@/pages/card-list";
import { CardViewPage } from "@/pages/card-view";
import { DeckFormPage } from "@/pages/deck-form";
import { DeckImportPage } from "@/pages/deck-import";
import { DeckListPage } from "@/pages/deck-list";
import { DeckStudyStartPage } from "@/pages/deck-study-start";
import { DeckStudyPage } from "@/pages/deck-study";
import { SettingsPage } from "@/pages/settings";
import { routes, useNavigation } from "@/shared/routes";
import { RouteFeedback } from "@/shared/ui/route-feedback";

/**
 * Renders the Unknown Route user interface.
 * Shows a page-not-found message with actions to go home or return to the previous route.
 */
const UnknownRoute = () => {
  const navigation = useNavigation();

  return (
    <RouteFeedback
      title="Page not found"
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
      secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
    />
  );
};

const login = async () => {
  await loginGoogle();
};

/**
 * Renders Tango's route tree inside the router supplied by the caller.
 * Production uses BrowserRouter while Storybook can provide MemoryRouter for isolated page stories.
 */
export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path={routes.deckList.path} element={<DeckListPage />} />
    <Route path={routes.cardList.path} element={<CardListPage />} />
    <Route path={routes.deckForm.path} element={<DeckFormPage />} />
    <Route path={routes.deckStudyStart.path} element={<DeckStudyStartPage />} />
    <Route path={routes.deckStudy.path} element={<DeckStudyPage />} />
    <Route path={routes.cardView.path} element={<CardViewPage />} />
    <Route path={routes.cardForm.path} element={<CardFormPage />} />
    <Route path={routes.settings.path} element={<SettingsPage login={login} logout={signOutCurrentUser} />} />
    <Route path={routes.deckImport.path} element={<DeckImportPage />} />
    <Route path={routes.notFound.path} element={<UnknownRoute />} />
  </Routes>
);

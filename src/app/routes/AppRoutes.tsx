/**
 * @file Defines Tango's route tree.
 * Each URL is connected to a dedicated page component.
 */

import type React from "react";
import { Route, Routes } from "react-router-dom";

import { AccountPage } from "@/pages/account";
import { CardCreatePage } from "@/pages/card-create";
import { CardFormPage } from "@/pages/card-form";
import { CardListPage } from "@/pages/card-list";
import { CardViewPage } from "@/pages/card-view";
import { DeckCreatePage } from "@/pages/deck-create";
import { DeckFormPage } from "@/pages/deck-form";
import { DeckImportPage } from "@/pages/deck-import";
import { DeckListPage } from "@/pages/deck-list";
import { NotFoundPage } from "@/pages/not-found";
import { SettingsPage } from "@/pages/settings";
import { StudySessionPage } from "@/pages/study-session";
import { StudySessionStartPage } from "@/pages/study-session-start";
import { routes } from "@/shared/router";

/**
 * Renders Tango's route tree inside the router supplied by the caller.
 * Production uses BrowserRouter while Storybook can provide MemoryRouter for isolated page stories.
 */
export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path={routes.deckList.path} element={<DeckListPage />} />
    <Route path={routes.deckCreate.path} element={<DeckCreatePage />} />
    <Route path={routes.cardList.path} element={<CardListPage />} />
    <Route path={routes.cardCreate.path} element={<CardCreatePage />} />
    <Route path={routes.deckForm.path} element={<DeckFormPage />} />
    <Route path={routes.deckStudyStart.path} element={<StudySessionStartPage />} />
    <Route path={routes.deckStudy.path} element={<StudySessionPage />} />
    <Route path={routes.cardView.path} element={<CardViewPage />} />
    <Route path={routes.cardForm.path} element={<CardFormPage />} />
    <Route path={routes.account.path} element={<AccountPage />} />
    <Route path={routes.settings.path} element={<SettingsPage />} />
    <Route path={routes.deckImport.path} element={<DeckImportPage />} />
    <Route path={routes.notFound.path} element={<NotFoundPage />} />
  </Routes>
);

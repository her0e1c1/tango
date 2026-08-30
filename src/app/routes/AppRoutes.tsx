/**
 * @file Defines Tango's route tree.
 * Each URL is connected to a dedicated page component.
 */

import { Outlet, type RouteObject } from "react-router-dom";

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

import { AppErrorFallback } from "../error-boundary";

export const appRoutes = [
  {
    element: <Outlet />,
    errorElement: <AppErrorFallback />,
    children: [
      { path: routes.deckList.path, element: <DeckListPage /> },
      { path: routes.deckCreate.path, element: <DeckCreatePage /> },
      { path: routes.cardList.path, element: <CardListPage /> },
      { path: routes.cardCreate.path, element: <CardCreatePage /> },
      { path: routes.deckForm.path, element: <DeckFormPage /> },
      { path: routes.deckStudyStart.path, element: <StudySessionStartPage /> },
      { path: routes.deckStudy.path, element: <StudySessionPage /> },
      { path: routes.cardView.path, element: <CardViewPage /> },
      { path: routes.cardForm.path, element: <CardFormPage /> },
      { path: routes.account.path, element: <AccountPage /> },
      { path: routes.settings.path, element: <SettingsPage /> },
      { path: routes.deckImport.path, element: <DeckImportPage /> },
      { path: routes.notFound.path, element: <NotFoundPage /> },
    ],
  },
] satisfies RouteObject[];

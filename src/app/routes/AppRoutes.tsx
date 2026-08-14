/**
 * @file Defines Tango's route tree.
 * Each URL is connected to a page component while route-level authentication actions and unknown
 * route recovery stay at the application boundary.
 */

import type React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import type { Card, CardCreateInput, CardEdit } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckEdit } from "@/entities/deck";
import type { StudyProgressEdit } from "@/entities/study-progress";
import { CardFormPage } from "@/pages/card-form";
import { CardListPage } from "@/pages/card-list";
import { CardViewPage } from "@/pages/card-view";
import { DeckFormPage } from "@/pages/deck-form";
import { DeckImportPage } from "@/pages/deck-import";
import { DeckListPage } from "@/pages/deck-list";
import { DeckStartPage } from "@/pages/deck-start";
import { DeckSwiperPage } from "@/pages/deck-swiper";
import { SettingsPage } from "@/pages/settings";
import { RouteFeedback } from "@/shared/ui/route-feedback";

/**
 * Renders the Unknown Route user interface.
 * Shows a page-not-found message with actions to go home or return to the previous route.
 */
const UnknownRoute = () => {
  const navigate = useNavigate();

  return (
    <RouteFeedback
      title="Page not found"
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => navigate("/") }}
      secondaryAction={{ label: "Go back", onClick: () => navigate(-1) }}
    />
  );
};

export interface AppRouteServices {
  card: {
    create: (uid: string, card: CardCreateInput) => Promise<void>;
    edit: (uid: string, card: CardEdit) => Promise<void>;
    remove: (uid: string, card: Card) => Promise<void>;
    generateId: () => string;
  };
  deck: {
    create: (uid: string, deck: DeckCreateInput) => Promise<void>;
    edit: (uid: string, deck: DeckEdit) => Promise<void>;
    remove: (uid: string, deck: Deck) => Promise<void>;
    generateId: () => string;
  };
  editStudyProgress: (uid: string, progress: StudyProgressEdit) => Promise<void>;
  login: () => Promise<unknown>;
  logout: () => Promise<void>;
}

/**
 * Renders Tango's route tree inside the router supplied by the caller.
 * Production uses BrowserRouter while Storybook can provide MemoryRouter for isolated page stories.
 */
export const AppRoutes: React.FC<{ services: AppRouteServices }> = ({ services }) => (
  <Routes>
    <Route
      path="/"
      element={
        <DeckListPage
          createCard={services.card.create}
          createDeck={services.deck.create}
          deleteDeck={services.deck.remove}
          editCard={services.card.edit}
          generateCardId={services.card.generateId}
          generateDeckId={services.deck.generateId}
        />
      }
    />
    <Route
      path="/deck/:id"
      element={
        <CardListPage
          deleteCard={services.card.remove}
          editDeck={services.deck.edit}
          editStudyProgress={services.editStudyProgress}
        />
      }
    />
    <Route path="/deck/:id/edit" element={<DeckFormPage editDeck={services.deck.edit} />} />
    <Route path="/deck/:id/start" element={<DeckStartPage editDeck={services.deck.edit} />} />
    <Route path="/deck/:id/study" element={<DeckSwiperPage editStudyProgress={services.editStudyProgress} />} />
    <Route path="/card/:id" element={<CardViewPage />} />
    <Route path="/card/:id/edit" element={<CardFormPage editCard={services.card.edit} />} />
    <Route
      path="/settings"
      element={<SettingsPage login={async () => void (await services.login())} logout={services.logout} />}
    />
    <Route
      path="/import"
      element={
        <DeckImportPage
          createCard={services.card.create}
          createDeck={services.deck.create}
          editCard={services.card.edit}
          generateCardId={services.card.generateId}
          generateDeckId={services.deck.generateId}
        />
      }
    />
    <Route path="*" element={<UnknownRoute />} />
  </Routes>
);

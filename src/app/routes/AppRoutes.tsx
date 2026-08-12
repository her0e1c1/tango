/**
 * @file Defines Tango's route tree.
 * Each URL is connected to a page component while route-level authentication actions and unknown
 * route recovery stay at the application boundary.
 */

import React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import { logout } from "@/app/auth/logout";
import { loginGoogle } from "@/features/auth";
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

/**
 * Renders Tango's route tree inside the router supplied by the caller.
 * Production uses BrowserRouter while Storybook can provide MemoryRouter for isolated page stories.
 */
export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<DeckListPage />} />
    <Route path="/deck/:id" element={<CardListPage />} />
    <Route path="/deck/:id/edit" element={<DeckFormPage />} />
    <Route path="/deck/:id/start" element={<DeckStartPage />} />
    <Route path="/deck/:id/study" element={<DeckSwiperPage />} />
    <Route path="/card/:id" element={<CardViewPage />} />
    <Route path="/card/:id/edit" element={<CardFormPage />} />
    <Route path="/settings" element={<SettingsPage login={loginGoogle} logout={logout} />} />
    <Route path="/import" element={<DeckImportPage />} />
    <Route path="*" element={<UnknownRoute />} />
  </Routes>
);

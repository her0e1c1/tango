/**
 * @file Defines Tango's top-level route tree and application shell.
 * Each URL is connected to a page component while shared authentication, layout, and remote-read
 * feedback wrap every route.
 */

import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { useAuth } from "@/auth/AuthContext";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { CardFormPage } from "@/pages/card-form";
import { CardListPage } from "@/pages/card-list";
import { CardViewPage } from "@/pages/card-view";
import { DeckFormPage } from "@/pages/deck-form";
import { DeckImportPage } from "@/pages/deck-import";
import { DeckListPage } from "@/pages/deck-list";
import { DeckStartPage } from "@/pages/deck-start";
import { DeckSwiperPage } from "@/pages/deck-swiper";
import { SettingsPage } from "@/pages/settings";
import { configStore } from "@/store/configStore";

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
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/import" element={<DeckImportPage />} />
    <Route path="*" element={<UnknownRoute />} />
  </Routes>
);

/**
 * Renders the App user interface.
 * Reads authentication and display settings, installs the application routes, and offers reload
 * when startup fails.
 */
const App: React.FC<{ reload?: () => void }> = ({ reload = () => window.location.reload() }) => {
  const darkMode = useStore(configStore, (state) => state.config.darkMode);
  const authState = useAuth();

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (authState.status === "initializing" || authState.status === "signedOut") {
    return (
      <RouteFeedback title="Starting Tango…" description="Preparing your decks and study progress." tone="loading" />
    );
  }

  if (authState.status === "error") {
    return (
      <RouteFeedback
        title="Unable to start Tango"
        description="Authentication could not be initialized."
        tone="error"
        primaryAction={{ label: "Reload", onClick: reload }}
      />
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;

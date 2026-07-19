import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { RouteFeedback } from "@/components";
import { useAuth } from "@/auth/AuthContext";
import * as Page from "@/page";
import { configStore } from "@/store/configStore";

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
      <Routes>
        <Route path="/" element={<Page.DeckListPage />} />
        <Route path="/deck/:id" element={<Page.CardListPage />} />
        <Route path="/deck/:id/edit" element={<Page.DeckFormPage />} />
        <Route path="/deck/:id/start" element={<Page.DeckStartPage />} />
        <Route path="/deck/:id/study" element={<Page.DeckSwiperPage />} />
        <Route path="/card/:id" element={<Page.CardViewPage />} />
        <Route path="/card/:id/edit" element={<Page.CardFormPage />} />
        <Route path="/settings" element={<Page.ConfigPage />} />
        <Route path="/import" element={<Page.DeckImportPage />} />
        <Route path="*" element={<UnknownRoute />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

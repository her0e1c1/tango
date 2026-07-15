import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import * as selector from "@/selector";
import * as Page from "@/page";

const App = () => {
  const darkMode = useSelector(selector.config.getByKey("darkMode"));
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;

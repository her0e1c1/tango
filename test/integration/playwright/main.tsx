import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/app/i18n";
import { replaceAuthSession } from "@/entities/auth";
import { clearStudySessions } from "@/entities/study-session";
import { StudySessionPage } from "@/pages/study-session";
import { studySessionPageStore } from "@/pages/study-session/model/store";
import { ToastViewport } from "@/shared/ui/toast";
import { createCard, createDeck } from "@/test/factories";
import {
  replacePreferences,
  replaceRemoteCards,
  replaceRemoteDecks,
  restoreStudySession,
} from "@/test/utils/entityFixtures";
import "@/app/styles/index.css";

const uid = "playwright-user";
const deckId = "playwright-deck";
const now = Date.UTC(2026, 6, 1, 12);
const showControls = new URLSearchParams(location.search).get("controls") === "on";
const cards = ["First prompt", "Second prompt", "Third prompt"].map((frontText, index) =>
  createCard({
    id: `playwright-card-${String(index + 1)}`,
    deckId,
    uid,
    frontText,
    backText: `${frontText} answer`,
    uniqueKey: `playwright-key-${String(index + 1)}`,
    createdAt: now,
    updatedAt: now,
  })
);

replaceAuthSession({ status: "authenticated", uid, isAnonymous: false, displayName: "Playwright user" });
replacePreferences({
  language: "en",
  loadSample: false,
  study: { shuffled: false, defaultAutoPlay: false, cardInterval: 60 },
  controls: {
    viewMode: false,
    showSwipeButtonList: showControls,
    showPlaybackControls: true,
    cardSwipeRight: "RateGood",
  },
});
replaceRemoteDecks([createDeck({ id: deckId, uid, name: "Playwright study", createdAt: now, updatedAt: now })]);
replaceRemoteCards(cards);
clearStudySessions();
restoreStudySession({
  sessionId: "playwright-session",
  deckId,
  cardOrderIds: cards.map(({ id }) => id),
  currentIndex: 0,
  lastStudiedAt: now,
  remote: { uid, startedAt: now },
});
studySessionPageStore.setState(studySessionPageStore.getInitialState(), true);

const root = document.getElementById("root");
if (root === null) throw new Error("Integration root is missing");
createRoot(root).render(
  <I18nProvider>
    <MemoryRouter initialEntries={[`/deck/${deckId}/study`]}>
      <Routes>
        <Route path="/deck/:id/study" element={<StudySessionPage />} />
      </Routes>
    </MemoryRouter>
    <ToastViewport />
  </I18nProvider>
);

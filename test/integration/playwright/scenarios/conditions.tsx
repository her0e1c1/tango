import { AppErrorBoundary } from "@/app/error-boundary";
import { applyCardChanges } from "@/entities/card/model/store";
import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { getStudySession } from "@/entities/study-session";
import { studySessionStore } from "@/entities/study-session/model/store";
import { preferencesStore } from "@/entities/preference/model/store";
import { applyStudySessionResult } from "@/test/utils/entityFixtures";
import type { FixtureState } from "../../../e2e/utils/yaml-fixture";
import { prepareApp, renderRoutes, io } from "../support";

export function snapshot() {
  return {
    cards: getCards(),
    decks: getDecks(),
    sessions: Object.fromEntries(
      Object.entries(studySessionStore.getState().sessionsByDeckId).map(([id, value]) => {
        if (!value) return [id, undefined];
        const { remote: _remote, ...session } = value;
        return [id, session];
      })
    ),
    preferences: preferencesStore.getState().preferences,
  };
}

export default function conditions(params: URLSearchParams) {
  const seed: FixtureState & { invalidCardIds?: string[] } = JSON.parse(
    sessionStorage.getItem("tango-integration-seed") ?? "null"
  );
  if (!seed) throw new Error("A prepared application store fixture is required");
  const user = seed.auth.users[0];
  if (!user) throw new Error("An authenticated fixture user is required");
  const persisted = JSON.parse(localStorage.getItem("tango-config") ?? "null")?.state?.preferences;
  prepareApp({
    auth: {
      status: "authenticated",
      uid: user.uid,
      isAnonymous: user.provider === "anonymous",
      displayName: user.provider === "anonymous" ? null : "Conditions user",
    },
    cards: seed.remote.cards,
    decks: seed.remote.decks,
    preferences: persisted ?? seed.browser.preferences,
    sessionsByDeckId: Object.fromEntries(
      Object.entries(seed.remote.studySessions).map(([id, session]) => [id, { ...session, startedAt: 0 }])
    ),
  });
  studySessionStore.setState({
    ownerUid: user.uid,
    remoteLoading: false,
    history: [],
    fromCache: false,
    syncError: null,
  });
  applyCardChanges([], { invalidCardIds: seed.invalidCardIds ?? [] });
  io.touchStudySession = async (deckId) => {
    const value = getStudySession(deckId);
    if (value) applyStudySessionResult({ ...value, lastStudiedAt: Date.now() }, null);
  };
  const view = renderRoutes(location.pathname + location.search);
  return params.get("variant") === "global-recovery" ? <AppErrorBoundary>{view}</AppErrorBoundary> : view;
}

import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { appI18n } from "@/app/i18n/instance";
import { replaceAuthSession } from "@/entities/auth";
import { getStudySession } from "@/entities/study-session";
import { studySessionStore } from "@/entities/study-session/model/store";
import type { StudySessionSnapshot } from "@/entities/study-session/model/types";
import { getPreferences, type LanguagePreference } from "@/entities/preference";
import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { submit } from "@/pages/card-edit/model/actions/submit";
import { replacePreferences, replaceRemoteCards } from "@/test/utils/entityFixtures";
import { createCard, createDeck } from "@/test/factories";
import { io, prepareApp, renderRoutes } from "../support";

const uid = "playwright-user";
const now = Date.UTC(2026, 6, 1, 12);
const deck = createDeck({
  id: "contract-deck",
  uid,
  name: "Japanese verbs",
  category: "math",
  createdAt: now,
  updatedAt: now,
});
const cards = ["Hello", "Second", "Third", "Fourth", "Fifth"].map((frontText, index) =>
  createCard({
    id: `contract-card-${String(index)}`,
    deckId: deck.id,
    uid,
    frontText,
    backText: index === 0 ? "Hola" : `${frontText} answer`,
    tags: index === 0 ? ["A"] : index === 1 ? ["B"] : ["A", "B"],
    uniqueKey: `key-${String(index)}`,
    createdAt: now + index,
    updatedAt: now + index,
  })
);
const user = { uid: "linked-user" } as User;
let signIn = Promise.withResolvers<User>();
let signOut = Promise.withResolvers<void>();
let write = Promise.withResolvers<void>();
let saved: Promise<unknown> | undefined;
let linked = false;
let failSave = false;

export function preferencesSnapshot() {
  return getPreferences();
}
export function dataSnapshot() {
  return JSON.stringify({ decks: getDecks(), cards: getCards(), session: getStudySession(deck.id) });
}

export function setAccount(value: boolean) {
  linked = value;
  replaceAuthSession({
    status: "authenticated",
    uid: value ? "linked-user" : "anonymous-user",
    displayName: value ? "Test User" : null,
    isAnonymous: !value,
  });
}
export function receiveIdentity(value: { uid: string; linked: boolean; displayName?: string }) {
  replaceAuthSession({
    status: "authenticated",
    uid: value.uid,
    displayName: value.displayName ?? null,
    isAnonymous: !value.linked,
  });
}
export function prepareRetry() {
  io.signInWithGoogle = async () => user;
  io.signOutCurrentUser = async () => undefined;
}
export function finishAuth(value: { operation: "in" | "out"; failure?: boolean }) {
  const pending = value.operation === "in" ? signIn : signOut;
  if (value.failure) pending.reject(new Error("Authentication failed"));
  else if (value.operation === "in") signIn.resolve(user);
  else signOut.resolve();
}
export async function language(value: string) {
  replacePreferences({ language: value === "ja" ? "ja" : "en" });
  await appI18n.changeLanguage(value);
}
export function beginCardSave() {
  const card = cards[0]!;
  saved = submit({ cardId: card.id, values: { frontText: "Saved content", backText: card.backText, tags: card.tags } });
}
export async function finishCardAndSignOut() {
  replaceAuthSession({ status: "initializing" });
  if (failSave) write.reject(new Error("Save refused"));
  else {
    replaceRemoteCards(
      cards.map((item) => (item.id === cards[0]!.id ? { ...item, frontText: "Saved content" } : item))
    );
    write.resolve();
  }
  await Promise.resolve();
  signOut.resolve();
  await saved;
}
export function authenticate() {
  replaceAuthSession({ status: "authenticated", uid, isAnonymous: true, displayName: null });
}

function scenarioLanguage(params: URLSearchParams, variant: string): LanguagePreference {
  if (variant === "settings-system") return "en";
  if (params.get("system") === "true") return "system";
  return params.get("locale") === "ja" ? "ja" : "en";
}

function prepareAuthResponses(params: URLSearchParams): void {
  const mode = params.get("mode");
  let attempts = 0;
  io.signInWithGoogle = async () => {
    if (mode === "retry" && attempts++ === 0) throw new Error("Authentication failed");
    if (mode === "failure") throw new Error("Authentication failed");
    if (mode === "pending") return signIn.promise;
    return user;
  };
  io.signOutCurrentUser = async () => {
    if (mode === "retry" && attempts++ === 0) throw new Error("Authentication failed");
    if (mode === "failure") throw new Error("Authentication failed");
    if (mode === "concurrent") {
      await signOut.promise;
      replaceAuthSession({ status: "authenticated", uid, displayName: "Owner", isAnonymous: false });
      throw new Error("Sign-out refused");
    }
    if (mode === "pending") await signOut.promise;
  };
  if (mode === "concurrent") {
    failSave = params.get("save") === "failure";
    replaceAuthSession({ status: "authenticated", uid, displayName: "Owner", isAnonymous: false });
    io.editCard = () => write.promise;
  }
}

export default function scenario(params: URLSearchParams): ReactNode {
  signIn = Promise.withResolvers<User>();
  signOut = Promise.withResolvers<void>();
  write = Promise.withResolvers<void>();
  // The scenario may reject an external response before the UI attaches its handler.
  void signIn.promise.catch(() => undefined);
  void signOut.promise.catch(() => undefined);
  const variant = params.get("variant") ?? "account";
  if (variant !== "settings-system")
    Object.defineProperty(navigator, "language", {
      configurable: true,
      value: params.get("locale") === "ja" ? "ja-JP" : "en-US",
    });
  const savedPreferences =
    variant === "settings-system" && localStorage.getItem("tango-config") !== null ? getPreferences() : undefined;
  prepareApp({
    decks: [deck],
    cards,
    preferences: {
      appearance: { darkMode: params.get("dark") === "true" },
      loadSample: false,
      language: scenarioLanguage(params, variant),
      study: {
        shuffled: false,
        cardInterval: variant === "settings-interval" ? 60 : 7,
        maxNumberOfCardsToLearn: variant === "settings-maximum" ? 0 : 24,
        useCardInterval: variant.startsWith("settings"),
        defaultAutoPlay: params.get("autoplay") === "true",
      },
      controls: {
        showPlaybackControls: params.get("playback") !== "false",
        showSwipeButtonList: true,
        showCardDetails: true,
        showSkip: true,
        showBackTextSwipeOverlays: false,
      },
      ...savedPreferences,
    },
  });
  linked = params.get("linked") === "true";
  if (variant === "account") setAccount(linked);
  prepareAuthResponses(params);
  if (variant === "history") {
    const history = Array.from({ length: 11 }, (_, index): StudySessionSnapshot => {
      const startedAt = now - (index === 10 ? 80 : index) * 86_400_000;
      const endReason = (["completed", "abandoned", null] as const)[index % 3]!;
      const endedAt = endReason === null ? null : startedAt + 1000;
      return {
        session: {
          sessionId: `history-${String(index)}`,
          deckId: deck.id,
          cardOrderIds: Array.from(
            { length: index + 1 },
            (_, cardIndex) => `history-card-${String(index)}-${String(cardIndex)}`
          ),
          currentIndex: 0,
          lastStudiedAt: endedAt ?? startedAt,
          remote: { uid, startedAt, createdAt: startedAt },
        },
        endedAt,
        endReason,
      };
    });
    studySessionStore.setState({ history, ownerUid: uid, remoteLoading: false, fromCache: false, syncError: null });
    return renderRoutes(`/study-history${params.get("days") === "90" ? "?days=90" : ""}`);
  }
  if (variant === "gate") {
    replaceAuthSession({ status: "initializing" });
    return renderRoutes(`/deck/${deck.id}`);
  }
  if (variant === "not-found") return renderRoutes("/unknown-page");
  return renderRoutes(variant.startsWith("settings") ? "/settings" : "/account");
}

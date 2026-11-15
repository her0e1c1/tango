import { StrictMode, useState } from "react";
import { getI18n } from "react-i18next";
import { CardView, FrontText, calculateFsrsState, getCards } from "@/entities/card";
import { getStudySession } from "@/entities/study-session";
import { getPreferences, updatePreferences } from "@/entities/preference";
import { CardPlayer, type CardPlayerProps } from "@/features/card-player/ui/CardPlayer";
import { CardOverlay } from "@/features/card-player/ui/CardOverlay";
import { Controller } from "@/features/card-player/ui/Controller";
import { SwipeButtonList } from "@/features/card-player/ui/SwipeButtonList";
import { StudySaveControls } from "@/pages/study-session/ui/StudySaveControls";
import { Layout } from "@/shared/ui/layout";
import { showToast } from "@/shared/ui/toast";
import { dismissToast } from "@/shared/ui/toast/model";
import * as fixture from "@/storybook/fixture";
import { prepareApp, renderRoutes, io, events, deck, cards, now, state, session, renderFixture } from "../support";

const record =
  (name: string) =>
  (...args: unknown[]) =>
    events.push({ name, args });
const longFront = "Long front text to read. ".repeat(600);
const longAnswer = "Long answer text to read.\n".repeat(300);

export function snapshot() {
  return { cards: getCards(), session: getStudySession(deck.id), preferences: getPreferences(), events };
}
export function remapDirections() {
  updatePreferences({
    controls: {
      cardSwipeUp: "GoBack",
      cardSwipeDown: "DoNothing",
      cardSwipeLeft: "GoToNextCard",
      cardSwipeRight: "RateHard",
    },
  });
}
export async function changeLanguage(language: string) {
  await getI18n().changeLanguage(language);
}
export function notify() {
  showToast({ messageKey: "Persistent warning", durationMs: null, dismissible: true });
}
export function dismissNotification() {
  dismissToast();
}

function applyControlFixture(props: CardPlayerProps, variant: string) {
  if (["swipe-hidden", "controls-hidden", "playback-only", "unavailable-explanation", "front-swipe"].includes(variant))
    props.showSwipeControls = false;
  if (["playback-hidden", "controls-hidden", "swipe-only", "unavailable-explanation"].includes(variant))
    props.showPlaybackControls = false;
  if (variant === "details-hidden") props.showCardDetails = false;
  if (["playback-unavailable", "unavailable-explanation"].includes(variant)) props.playbackControlsAvailable = false;
  if (variant === "rated") props.cardOverlaySlot = <CardOverlay fsrs={{ difficulty: 8, lastReviewedAt: now }} />;
}

function applyAnswerFixture(props: CardPlayerProps, variant: string) {
  if (variant.startsWith("answer") || variant === "long-answer" || variant === "deck-view-answer") {
    props.showBackText = true;
    props.backTextSlot = <CardView text={longAnswer} variant="bare" />;
  }
  if (variant === "answer-overlays")
    props.backTextOverlay = { onClickLeft: record("edgeLeft"), onClickRight: record("edgeRight") };
  if (variant === "answer-allowed") {
    props.viewMode = true;
    props.allowBackHorizontalSwipe = true;
  }
  if (variant === "dark-math") {
    props.showBackText = true;
    props.backTextSlot = (
      <CardView text={`${fixture.math.markdown}\n${fixture.math.block}`} category="math" variant="bare" />
    );
  }
  if (variant === "answer-chrome")
    props.editLink = { visible: true, onToggle: record("edit"), element: <a href="#edit">Edit card</a> };
}

function applyReadingFixture(props: CardPlayerProps, variant: string, viewMode: boolean) {
  if (
    (variant.startsWith("reading") && !["reading-toggle", "reading-visibility"].includes(variant)) ||
    variant.startsWith("view-mode")
  ) {
    props.viewMode = variant !== "reading-toggle" || viewMode;
    props.frontTextSlot = (
      <FrontText
        viewMode
        text={
          variant === "reading-selection"
            ? "Select this front text"
            : variant === "reading-space"
              ? "Readable front text"
              : variant === "reading-math"
                ? Array(20).fill(fixture.math.block).join("\n\n")
                : longFront
        }
        {...(variant === "reading-math" ? { category: "math" } : {})}
      />
    );
    props.swipeButtonList = { onClickLeft: record("directionLeft") };
  }
}

function applyViewingFixture(props: CardPlayerProps, variant: string) {
  if (variant === "deck-view" || variant === "deck-view-answer") {
    props.allowBackHorizontalSwipe = true;
    props.answerLabel = "Card answer";
    props.controller = { ...props.controller, index: 0, progressLabel: "Viewing progress" };
    props.swipeButtonList = {
      disabledDirections: { cardSwipeUp: true, cardSwipeDown: true },
      labels: { cardSwipeLeft: "Previous card", cardSwipeRight: "Next card" },
      onClickLeft: record("previous"),
      onClickRight: record("next"),
    };
  }
}

function Widget({ variant, params }: { variant: string; params: URLSearchParams }) {
  const [viewMode, setViewMode] = useState(
    (variant.startsWith("reading") && variant !== "reading-toggle") || variant.startsWith("view-mode")
  );
  const [help, setHelp] = useState(true);
  const [viewShortcut, setViewShortcut] = useState(true);
  const [details, setDetails] = useState(true);
  const [edit, setEdit] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [index, setIndex] = useState(variant === "controller-position" ? 0 : 3);
  const props: CardPlayerProps = {
    viewMode,
    onToggleViewMode: () => {
      record("viewMode")();
      if (variant === "reading-toggle") setViewMode(!viewMode);
    },
    showHelp: help,
    onToggleHelp: () => {
      record("help")();
      if (!variant.startsWith("shortcuts")) setHelp(!help);
    },
    showViewMode: viewShortcut,
    onToggleShowViewMode: () => {
      record("viewShortcut")();
      if (!variant.startsWith("shortcuts")) setViewShortcut(!viewShortcut);
    },
    showCardDetails: details,
    onToggleCardDetails: () => {
      record("details")();
      setDetails(!details);
    },
    showSwipeControls: true,
    onToggleSwipeControls: record("swipeControls"),
    showPlaybackControls: true,
    onTogglePlaybackControls: record("playbackControls"),
    playbackControlsAvailable: true,
    onBack: record("back"),
    onSwipeUp: record("swipeUp"),
    onSwipeLeft: record("swipeLeft"),
    onAnswerClick: record("answerClick"),
    frontTextSlot: <FrontText text="front text" />,
    cardOverlaySlot: <CardOverlay fsrs={null} />,
    controller: { autoPlay: false, index: 3, numberOfCards: 24 },
    swipeButtonList: { disabledDirections: { cardSwipeLeft: true } },
    help: {
      open: helpOpen,
      rows: [
        { control: "cardSwipeUp", action: "RateGood" },
        { control: "flip", action: "flip" },
      ],
      onOpen: () => setHelpOpen(true),
      onClose: () => setHelpOpen(false),
    },
  };
  applyControlFixture(props, variant);
  applyAnswerFixture(props, variant);
  applyReadingFixture(props, variant, viewMode);
  if (variant === "edit-link")
    props.editLink = {
      visible: edit,
      onToggle: () => setEdit(!edit),
      element: (
        <a href="#edit" aria-label="Edit card">
          Edit card
        </a>
      ),
    };
  if (variant.startsWith("shortcuts")) {
    props.showHelp = params.get("help") === "true";
    props.showViewMode = params.get("view") === "true";
    props.editLink = {
      visible: params.get("edit") === "true",
      onToggle: record("edit"),
      element: <a href="#edit">Edit card</a>,
    };
  }
  if (variant === "toolbar") {
    props.showSkipControls = true;
    props.onToggleSkipControls = record("skipControls");
  }
  applyViewingFixture(props, variant);
  if (variant.startsWith("controller"))
    return (
      <Controller
        autoPlay={autoPlay}
        index={index}
        numberOfCards={variant === "controller-position" ? 5 : 24}
        onToggleAutoPlay={() => {
          record("play")();
          setAutoPlay(!autoPlay);
        }}
        onChange={(value) => {
          record("position")(value);
          setIndex(Math.max(index, value));
        }}
      />
    );
  if (variant === "directions" || variant === "disabled-direction")
    return (
      <>
        <button type="button">Before directions</button>
        <SwipeButtonList
          {...(variant === "disabled-direction" ? { disabledDirections: { cardSwipeLeft: true } } : {})}
          onClickLeft={record("left")}
        />
      </>
    );
  if (variant === "save-controls") return <StudySaveControls pending={false} onSkip={record("skip")} />;
  return (
    <Layout fullscreen>
      <CardPlayer {...props} />
    </Layout>
  );
}

function renderWidget(variant: string, params: URLSearchParams) {
  document.documentElement.classList.toggle("dark", variant === "widget-dark-math");
  const widget = <Widget variant={variant.slice(7)} params={params} />;
  return renderFixture(variant === "widget-help-notification" ? <StrictMode>{widget}</StrictMode> : widget);
}

function renderTimingScenario(variant: string) {
  const feedback = variant === "feedback";
  const timingCards = cards
    .slice(0, 2)
    .map((card, index) => (!feedback && index === 0 ? { ...card, fsrs: calculateFsrsState(null, "easy", now) } : card));
  prepareApp({
    decks: [deck],
    cards: timingCards,
    auth: { status: "authenticated", uid: deck.uid, isAnonymous: !feedback, displayName: null },
    preferences: {
      ...state.preferences,
      appearance: { showSwipeFeedback: feedback },
      study: { ...state.preferences.study, defaultAutoPlay: false, useCardInterval: true },
      controls: { ...state.preferences.controls, viewMode: false },
    },
    ...(feedback ? { sessionsByDeckId: session(0, timingCards) } : {}),
  });
  return renderRoutes(feedback ? `/deck/${deck.id}/study` : `/card/${timingCards[0]!.id}`);
}

function createSessionCards(variant: string) {
  return variant === "playback"
    ? Array.from({ length: 24 }, (_, index) => ({
        ...cards[0]!,
        id: `study-${index}`,
        frontText: `Prompt ${index + 1}`,
      }))
    : variant === "answer"
      ? cards.slice(0, 2)
      : variant === "pilot"
        ? cards.slice(0, 3)
        : cards;
}

function createSessionPreferences(variant: string, params: URLSearchParams) {
  return {
    ...state.preferences,
    study: { ...state.preferences.study, defaultAutoPlay: false },
    controls: {
      ...state.preferences.controls,
      viewMode: false,
      ...(variant === "pilot" ? { showSwipeButtonList: params.get("controls") === "on" } : {}),
      showSkip: variant === "skip",
      showBackTextSwipeOverlays: variant === "answer" || variant === "failure",
      ...(variant === "disabled" ? { cardSwipeLeft: "DoNothing" as const } : {}),
      ...(variant === "direction" ? { cardSwipeLeft: "GoToNextCard" as const } : {}),
      ...(variant === "help" ? { cardSwipeUp: "RateGood" as const } : {}),
    },
  };
}

export default function study(params: URLSearchParams) {
  const variant = params.get("variant") ?? "session";
  if (["feedback", "review-deadline"].includes(variant)) return renderTimingScenario(variant);
  const starting = variant.startsWith("start") || variant === "no-matches";
  const pageCards = createSessionCards(variant);
  const preferences = createSessionPreferences(variant, params);
  prepareApp({
    ...state,
    auth: { status: "authenticated", uid: deck.uid, isAnonymous: false, displayName: "Playwright user" },
    cards: ["playback", "answer", "pilot"].includes(variant) ? pageCards : state.cards,
    preferences,
    ...(variant === "no-matches"
      ? { decks: [{ ...deck, studyFilter: { selectedTags: ["missing"], tagAndFilter: false } }] }
      : {}),
    ...(starting ? {} : { sessionsByDeckId: session(variant === "playback" ? 3 : 0, pageCards) }),
  });
  if (variant.startsWith("widget-")) return renderWidget(variant, params);
  if (variant === "failure")
    io.writeStudyAnswer = async () => {
      throw new Error("Offline");
    };
  if (variant === "start-retry") {
    const start = io.startStudy;
    let failed = false;
    io.startStudy = (...args) => {
      if (!failed) {
        failed = true;
        return Promise.reject(new Error("Unavailable"));
      }
      return start(...args);
    };
  }
  return renderRoutes(`/deck/${deck.id}/${starting ? "start" : "study"}`);
}

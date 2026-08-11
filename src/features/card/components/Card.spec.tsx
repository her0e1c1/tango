/**
 * @file Verifies the "Card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders compact metadata
 * and routes view, menu actions, and swipes by card id", "uses explicit copy for unstudied and
 * singular study counts", "keeps study and tag metadata outside the View button".
 */

import * as React from "react";
import { fireEvent, render, within, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import type { Card as CardEntity } from "@/entities/card";
import { Card } from "@/features/card/components/Card";

const card = {
  id: "card-id",
  frontText: "A long front",
  backText: "Back",
  score: 3,
  numberOfSeen: 7,
  tags: ["one", "two"],
} as CardEntity;

/**
 * Renders the test-only Controlled Card component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const ControlledCard: React.FC<React.ComponentProps<typeof Card>> = (props) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <Card
      {...props}
      menuOpen={menuOpen}
      onToggleMenu={(id) => {
        props.onToggleMenu?.(id);
        setMenuOpen((value) => !value);
      }}
      onCloseMenu={() => setMenuOpen(false)}
    />
  );
};

/**
 * Provides the swipe test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const swipe = (article: HTMLElement, from: number, to: number) => {
  fireEvent.mouseDown(article, { clientX: from, clientY: 0 });
  fireEvent.mouseMove(document, { clientX: to, clientY: 0 });
  fireEvent.mouseUp(document, { clientX: to, clientY: 0 });
};

/**
 * Provides the touch gesture test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const touchGesture = (target: HTMLElement, from: number, to: number) => {
  const start = { identifier: 1, target, clientX: from, clientY: 24 };
  const end = { identifier: 1, target, clientX: to, clientY: 24 };

  fireEvent.touchStart(target, { touches: [start], targetTouches: [start], changedTouches: [start] });
  fireEvent.touchMove(target, { touches: [end], targetTouches: [end], changedTouches: [end] });
  fireEvent.touchEnd(target, { touches: [], targetTouches: [], changedTouches: [end] });
};

describe("Card", () => {
  it("renders compact metadata and routes view, menu actions, and swipes by card id", () => {
    const actions = {
      goToView: vi.fn(),
      goToEdit: vi.fn(),
      onDelete: vi.fn(),
      onSwipedLeft: vi.fn(),
      onSwipedRight: vi.fn(),
      onToggleMenu: vi.fn(),
    };
    render(<ControlledCard card={card} {...actions} />);
    const article = screen.getByRole("article");

    expect(screen.getByLabelText("Score 3, positive")).toBeInTheDocument();
    expect(screen.getByText("studied 7 times")).toBeInTheDocument();
    expect(screen.getByLabelText("Tags: one, two")).toHaveTextContent("onetwo");
    fireEvent.click(screen.getByRole("button", { name: "View A long front" }));
    expect(actions.goToView).toHaveBeenCalledExactlyOnceWith(card.id);

    const trigger = screen.getByRole("button", { name: "Open actions for A long front" });
    fireEvent.click(trigger);
    expect(actions.onToggleMenu).toHaveBeenCalledExactlyOnceWith(card.id);
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(actions.goToEdit).toHaveBeenCalledExactlyOnceWith(card.id);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(actions.onDelete).toHaveBeenCalledExactlyOnceWith(card.id);

    swipe(article, 100, 0);
    swipe(article, 0, 100);
    expect(actions.onSwipedLeft).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(actions.onSwipedRight).toHaveBeenCalledExactlyOnceWith(card.id);
  });

  it("uses explicit copy for unstudied and singular study counts", () => {
    const view = render(<Card card={{ ...card, numberOfSeen: 0 }} />);
    expect(screen.getByText("not studied yet")).toBeInTheDocument();

    view.rerender(<Card card={{ ...card, numberOfSeen: 1 }} />);
    expect(screen.getByText("studied 1 time")).toBeInTheDocument();
  });

  it("keeps study and tag metadata outside the View button", () => {
    render(<Card card={card} />);
    const viewButton = screen.getByRole("button", { name: "View A long front" });
    const studyText = screen.getByText("studied 7 times");
    const tags = screen.getByLabelText("Tags: one, two");

    expect(viewButton).not.toContainElement(studyText);
    expect(viewButton).not.toContainElement(tags);
  });

  it("renders card tags as compact read-only markers", () => {
    render(<Card card={card} />);
    const metadata = screen.getByLabelText("Tags: one, two");

    expect(within(metadata).queryByRole("button")).not.toBeInTheDocument();
    expect(within(metadata).getByText("one")).toBeVisible();
  });

  it("covers the complete central region with View without owning its metadata", () => {
    render(<Card card={card} />);
    const viewButton = screen.getByRole("button", { name: "View A long front" });

    expect(viewButton).toHaveClass("absolute", "inset-0");
    expect(viewButton).not.toContainElement(screen.getByText("studied 7 times"));
  });

  it("treats a swipe from View as only a swipe and allows a later View click", () => {
    vi.useFakeTimers();
    const goToView = vi.fn();
    const onSwipedLeft = vi.fn();
    render(<Card card={card} goToView={goToView} onSwipedLeft={onSwipedLeft} />);
    const viewButton = screen.getByRole("button", { name: "View A long front" });

    swipe(viewButton, 100, 0);
    fireEvent.click(viewButton);
    expect(onSwipedLeft).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(goToView).not.toHaveBeenCalled();

    vi.runAllTimers();
    fireEvent.click(viewButton);
    expect(goToView).toHaveBeenCalledExactlyOnceWith(card.id);
    vi.useRealTimers();
  });

  it("does not start swipe tracking from the actions menu trigger", () => {
    const onSwipedLeft = vi.fn();
    render(<ControlledCard card={card} onSwipedLeft={onSwipedLeft} />);
    const trigger = screen.getByRole("button", { name: "Open actions for A long front" });

    swipe(trigger, 100, 0);
    fireEvent.click(trigger);

    expect(onSwipedLeft).not.toHaveBeenCalled();
    expect(screen.getByRole("menu", { name: "Actions for A long front" })).toBeInTheDocument();
  });

  it("isolates complete touch sequences on the actions trigger while preserving its click", () => {
    const onSwipedLeft = vi.fn();
    const onSwipedRight = vi.fn();
    render(<ControlledCard card={card} onSwipedLeft={onSwipedLeft} onSwipedRight={onSwipedRight} />);
    const trigger = screen.getByRole("button", { name: "Open actions for A long front" });

    touchGesture(trigger, 240, 80);
    touchGesture(trigger, 80, 240);
    touchGesture(trigger, 180, 184);

    expect(onSwipedLeft).not.toHaveBeenCalled();
    expect(onSwipedRight).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "Actions for A long front" })).toBeInTheDocument();
  });

  it("suppresses view, menu, and swipe actions while pending", () => {
    const actions = {
      goToView: vi.fn(),
      goToEdit: vi.fn(),
      onDelete: vi.fn(),
      onSwipedLeft: vi.fn(),
      onSwipedRight: vi.fn(),
      onToggleMenu: vi.fn(),
    };
    render(<ControlledCard card={card} disabled {...actions} />);
    const article = screen.getByRole("article");

    expect(article).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "View A long front" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Open actions for A long front" })).toBeDisabled();
    swipe(article, 100, 0);
    swipe(article, 0, 100);
    expect(Object.values(actions).every((action) => action.mock.calls.length === 0)).toBe(true);
  });
});

import * as React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Card } from "@/features/card/components/Card";

const card = {
  id: "card-id",
  frontText: "A long front",
  backText: "Back",
  score: 3,
  numberOfSeen: 7,
  tags: ["one", "two"],
} as Card;

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

const swipe = (article: HTMLElement, from: number, to: number) => {
  fireEvent.mouseDown(article, { clientX: from, clientY: 0 });
  fireEvent.mouseMove(document, { clientX: to, clientY: 0 });
  fireEvent.mouseUp(document, { clientX: to, clientY: 0 });
};

describe("Card", () => {
  afterEach(cleanup);

  it("renders compact metadata and routes view, menu actions, and swipes by card id", () => {
    const actions = {
      goToView: vi.fn(),
      goToEdit: vi.fn(),
      onDelete: vi.fn(),
      onSwipedLeft: vi.fn(),
      onSwipedRight: vi.fn(),
      onToggleMenu: vi.fn(),
    };
    const view = render(<ControlledCard card={card} {...actions} />);
    const article = view.getByRole("article");

    expect(view.getByLabelText("Score 3, positive")).toBeInTheDocument();
    expect(view.getByText("studied 7 times")).toBeInTheDocument();
    expect(view.getByLabelText("Tags: one, two")).toHaveTextContent("onetwo");
    fireEvent.click(view.getByRole("button", { name: "View A long front" }));
    expect(actions.goToView).toHaveBeenCalledExactlyOnceWith(card.id);

    const trigger = view.getByRole("button", { name: "Open actions for A long front" });
    fireEvent.click(trigger);
    expect(actions.onToggleMenu).toHaveBeenCalledExactlyOnceWith(card.id);
    fireEvent.click(view.getByRole("menuitem", { name: "Edit" }));
    expect(actions.goToEdit).toHaveBeenCalledExactlyOnceWith(card.id);
    fireEvent.click(trigger);
    fireEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    expect(actions.onDelete).toHaveBeenCalledExactlyOnceWith(card.id);

    swipe(article, 100, 0);
    swipe(article, 0, 100);
    expect(actions.onSwipedLeft).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(actions.onSwipedRight).toHaveBeenCalledExactlyOnceWith(card.id);
  });

  it("uses explicit copy for unstudied and singular study counts", () => {
    const view = render(<Card card={{ ...card, numberOfSeen: 0 }} />);
    expect(view.getByText("not studied yet")).toBeInTheDocument();

    view.rerender(<Card card={{ ...card, numberOfSeen: 1 }} />);
    expect(view.getByText("studied 1 time")).toBeInTheDocument();
  });

  it("keeps study and tag metadata outside the View button", () => {
    const view = render(<Card card={card} />);
    const viewButton = view.getByRole("button", { name: "View A long front" });
    const studyText = view.getByText("studied 7 times");
    const tags = view.getByLabelText("Tags: one, two");

    expect(viewButton).not.toContainElement(studyText);
    expect(viewButton).not.toContainElement(tags);
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
    const view = render(<ControlledCard card={card} disabled {...actions} />);
    const article = view.getByRole("article");

    expect(article).toHaveAttribute("aria-busy", "true");
    expect(view.getByRole("button", { name: "View A long front" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Open actions for A long front" })).toBeDisabled();
    swipe(article, 100, 0);
    swipe(article, 0, 100);
    expect(Object.values(actions).every((action) => action.mock.calls.length === 0)).toBe(true);
  });
});

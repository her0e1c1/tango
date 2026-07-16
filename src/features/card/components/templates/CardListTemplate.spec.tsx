import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardListTemplate } from "@/features/card/components/templates/CardListTemplate";
import { createCard } from "@/test/factories";

const card = createCard({ id: "card-id", frontText: "Front", backText: "Back", score: 0, tags: [] });

describe("CardListTemplate", () => {
  afterEach(cleanup);
  it("preserves feedback and zero-card composition with a non-sticky filter boundary", () => {
    const view = render(
      <CardListTemplate cards={[]} feedbackSlot={<div role="status">Saved</div>} filterSlot={<div>Filters</div>} />
    );
    expect(view.getByRole("status")).toHaveTextContent("Saved");
    const details = view.getByText("filter").closest("details");
    expect(details).not.toHaveClass("sticky");
    expect(view.queryByText(/no cards/i)).not.toBeInTheDocument();
  });

  it("preserves card display and overlay close callbacks", () => {
    const onShowCard = vi.fn();
    const onClose = vi.fn();
    const view = render(
      <CardListTemplate
        cards={[card]}
        onShowCard={onShowCard}
        overlay={{ backText: { text: "Overlay back" }, onClose }}
      />
    );
    fireEvent.click(view.getByText("Front"));
    expect(onShowCard).toHaveBeenCalledExactlyOnceWith(card);
    fireEvent.click(view.getByRole("button", { name: "Close card" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(view.getByText("Overlay back")).toBeInTheDocument();
  });
});

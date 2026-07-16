import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { DeckListTemplate } from "@/features/deck/components/templates/DeckListTemplate";

describe("DeckListTemplate", () => {
  afterEach(cleanup);

  it("provides a clear page heading and preserves feedback content", () => {
    const view = render(<DeckListTemplate decks={[]} feedbackSlot={<div role="status">Saved</div>} />);

    expect(view.getByRole("heading", { level: 1, name: "Decks" })).toBeInTheDocument();
    expect(view.getByRole("status")).toHaveTextContent("Saved");
  });

  it("does not introduce an empty-state message", () => {
    const view = render(<DeckListTemplate decks={[]} />);

    expect(view.queryByText(/no decks/i)).not.toBeInTheDocument();
  });
});

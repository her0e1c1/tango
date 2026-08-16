import type { RemoteCard } from "@/entities/card";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  editCard: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  editCard: mocks.editCard,
}));
vi.mock("@/entities/deck", () => ({ CATEGORY: ["language", "math"] }));

import { CardEditForm } from "./CardEditForm";
import { useCardEditAction } from "../model/useCardEditAction";
import { useCardFormState } from "../model/useCardFormState";

const CardEditFormHarness = (props: { card: RemoteCard; onCancel: () => void; onSaved: () => void }) => {
  const editAction = useCardEditAction({ onSaved: props.onSaved });
  const form = useCardFormState({ card: props.card, onCancel: props.onCancel, onSubmit: editAction.update });

  return <CardEditForm form={form} saveError={editAction.error} />;
};

describe("CardEditForm", () => {
  const card: RemoteCard = createCard({
    id: "card-id",
    uid: "user-id",
    frontText: "Front text",
    backText: "Back text",
    tags: ["language"],
  });

  beforeEach(() => {
    mocks.editCard.mockReset().mockResolvedValue(undefined);
  });

  it("saves edited form values for the authenticated user and reports success", async () => {
    const onSaved = vi.fn();
    render(<CardEditFormHarness card={card} onCancel={vi.fn()} onSaved={onSaved} />);

    const frontText = screen.getByRole("textbox", { name: "Front text" });
    const backText = screen.getByRole("textbox", { name: "Back text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Updated front");
    await userEvent.clear(backText);
    await userEvent.type(backText, "Updated back");
    await userEvent.click(screen.getByRole("checkbox", { name: "math" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mocks.editCard).toHaveBeenCalledWith("user-id", {
        id: card.id,
        frontText: "Updated front",
        backText: "Updated back",
        tags: ["language", "math"],
      })
    );
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("uses the form submit state while saving", async () => {
    let finishSave: (() => void) | undefined;
    mocks.editCard.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
    );
    render(<CardEditFormHarness card={card} onCancel={vi.fn()} onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    finishSave?.();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
  });

  it("keeps edited values and allows another save after a failure", async () => {
    mocks.editCard.mockRejectedValueOnce(new Error("write failed"));
    const onSaved = vi.fn();
    render(<CardEditFormHarness card={card} onCancel={vi.fn()} onSaved={onSaved} />);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Retry front");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(frontText).toHaveValue("Retry front");
    expect(onSaved).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mocks.editCard).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument());
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("forwards cancellation from both navigation actions", async () => {
    const onCancel = vi.fn();
    render(<CardEditFormHarness card={card} onCancel={onCancel} onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Back to cards" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("validates fields before saving", async () => {
    render(<CardEditFormHarness card={card} onCancel={vi.fn()} onSaved={vi.fn()} />);
    await userEvent.clear(screen.getByRole("textbox", { name: "Front text" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "   ");
    await userEvent.clear(screen.getByRole("textbox", { name: "Back text" }));

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(screen.getByText("Back text is required.")).toBeVisible();
    expect(mocks.editCard).not.toHaveBeenCalled();
  });
});

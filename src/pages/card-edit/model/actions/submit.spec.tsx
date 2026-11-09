import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { editCard, waitForCardContent } from "@/entities/card";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";
import { createCard } from "@/test/factories";

import { submit } from "./submit";

const session = vi.hoisted(() => ({ uid: "opening-user" as string | undefined }));
vi.mock("@/entities/auth", () => ({
  getAuthUid: () => session.uid ?? "",
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  editCard: vi.fn(),
  waitForCardContent: vi.fn(),
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-MANAGEMENT-01 CARD-MANAGEMENT-04 card edit submission", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    vi.mocked(editCard).mockReset();
    vi.mocked(waitForCardContent).mockReset().mockResolvedValue(true);
    session.uid = "opening-user";
  });

  it.each(["saving-user", undefined])(
    "uses the session at submission (%s) and sends only editable content",
    async (uid) => {
      // Given: Prepare `card`, `values`, `saved` and any shared test state below.
      const card = createCard({ tags: ["custom-tag"], uid: "owner" });
      render(<ToastViewport />);
      session.uid = uid;
      const values = { frontText: "Edited front", backText: "Edited back", tags: [...card.tags] };
      let saved = false;
      // When: Exercise `actAsync` with the prepared inputs.
      await actAsync(async () => {
        saved = await submit({ cardId: card.id, values });
      });

      // Then: Verify the expected result in the assertions below.
      expect(saved).toBe(true);
      expect(editCard).toHaveBeenCalledWith(uid ?? "", {
        id: card.id,
        frontText: "Edited front",
        backText: "Edited back",
        tags: ["custom-tag"],
      });
    }
  );

  it("snapshots the submitted content while persistence is pending", async () => {
    // Given: Prepare `pending` and any shared test state below.
    const pending = Promise.withResolvers<void>();
    vi.mocked(editCard).mockImplementation(async (_uid, input) => {
      await pending.promise;
      expect(input).toEqual({ id: "card-id", frontText: "Submitted", backText: "Back", tags: ["custom-tag"] });
    });
    // When: Exercise `render` with the prepared inputs.
    render(<ToastViewport />);
    const values = { frontText: "Submitted", backText: "Back", tags: ["custom-tag"] };
    const saved = submit({ cardId: "card-id", values });
    values.frontText = "Later";
    values.tags.push("later-tag");
    await actAsync(async () => {
      pending.resolve();
      await saved;
    });

    // Then: Verify the expected result in the assertions below.
    await expect(saved).resolves.toBe(true);
  });

  it("returns false with shared feedback on failure and retries the same Card", async () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.mocked(editCard).mockRejectedValueOnce(new Error("write failed"));
    // When: Exercise `render` with the prepared inputs.
    render(<ToastViewport />);
    const input = { cardId: "card-id", values: { frontText: "Retry", backText: "Back", tags: [] } };
    // Then: Verify the expected result in the assertions below.
    await actAsync(async () => {
      expect(await submit(input)).toBe(false);
    });
    expect(screen.getByText("Unable to save changes. Try again.")).toBeVisible();
    await actAsync(async () => {
      expect(await submit(input)).toBe(true);
    });
    expect(editCard).toHaveBeenLastCalledWith("opening-user", { id: "card-id", ...input.values });
  });
  it("CARD-MANAGEMENT-20 suppresses an old failure after a newer edit succeeds", async () => {
    // Given: The first save remains pending while another visit saves the same Card.
    const firstWrite = Promise.withResolvers<void>();
    vi.mocked(editCard).mockImplementationOnce(() => firstWrite.promise);
    render(<ToastViewport />);
    const oldSave = submit({ cardId: "card-id", values: { frontText: "Old", backText: "Back", tags: [] } });

    // When: The newer operation succeeds, followed by rejection of the old write.
    await actAsync(async () => {
      expect(await submit({ cardId: "card-id", values: { frontText: "New", backText: "Back", tags: [] } })).toBe(true);
      firstWrite.reject(new Error("old write rejected"));
      expect(await oldSave).toBe(false);
    });

    // Then: The successful current edit is not replaced by an obsolete error.
    expect(screen.getByText("Updated card “New”.")).toBeVisible();
    expect(screen.queryByText("Unable to save changes. Try again.")).not.toBeInTheDocument();
  });

  it("CARD-MANAGEMENT-20 rechecks supersession when observation has just completed", async () => {
    // Given: The old operation is waiting for its submitted content to be observed.
    const observation = Promise.withResolvers<boolean>();
    vi.mocked(waitForCardContent).mockImplementationOnce(() => observation.promise);
    render(<ToastViewport />);
    const oldSave = submit({ cardId: "card-id", values: { frontText: "Old", backText: "Back", tags: [] } });
    await Promise.resolve();

    // When: A new save starts after observation resolves but before the old continuation resumes.
    await actAsync(async () => {
      observation.resolve(true);
      const newSave = submit({ cardId: "card-id", values: { frontText: "New", backText: "Back", tags: [] } });
      expect(await oldSave).toBe(false);
      expect(await newSave).toBe(true);
    });

    // Then: Only the current save announces success.
    expect(screen.getByText("Updated card “New”.")).toBeVisible();
    expect(screen.queryByText("Updated card “Old”.")).not.toBeInTheDocument();
  });
});

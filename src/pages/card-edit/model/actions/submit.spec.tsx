import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { editCard } from "@/entities/card";
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
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-MANAGEMENT-01 CARD-MANAGEMENT-04 card edit submission", () => {
  beforeEach(() => {
    dismissToast();
    vi.mocked(editCard).mockReset();
    session.uid = "opening-user";
  });

  it.each(["saving-user", undefined])(
    "uses the session at submission (%s) and sends only editable content",
    async (uid) => {
      const card = createCard({ tags: ["custom-tag"], uid: "owner" });
      render(<ToastViewport />);
      session.uid = uid;
      const values = { frontText: "Edited front", backText: "Edited back", tags: [...card.tags] };
      let saved: Awaited<ReturnType<typeof submit>>;
      await actAsync(async () => {
        saved = await submit({ cardId: card.id, values });
      });

      expect(saved).toEqual(values);
      expect(editCard).toHaveBeenCalledWith(
        uid ?? "",
        {
          id: card.id,
          frontText: "Edited front",
          backText: "Edited back",
          tags: ["custom-tag"],
        },
        expect.any(Function)
      );
    }
  );

  it("snapshots the submitted content while persistence is pending", async () => {
    const pending = Promise.withResolvers<void>();
    vi.mocked(editCard).mockImplementation(async (_uid, input) => {
      await pending.promise;
      expect(input).toEqual({ id: "card-id", frontText: "Submitted", backText: "Back", tags: ["custom-tag"] });
    });
    render(<ToastViewport />);
    const values = { frontText: "Submitted", backText: "Back", tags: ["custom-tag"] };
    const saved = submit({ cardId: "card-id", values });
    values.frontText = "Later";
    values.tags.push("later-tag");
    await actAsync(async () => {
      pending.resolve();
      await saved;
    });

    await expect(saved).resolves.toEqual({ frontText: "Submitted", backText: "Back", tags: ["custom-tag"] });
  });

  it("returns false with shared feedback on failure and retries the same Card", async () => {
    vi.mocked(editCard).mockRejectedValueOnce(new Error("write failed"));
    render(<ToastViewport />);
    const input = { cardId: "card-id", values: { frontText: "Retry", backText: "Back", tags: [] } };
    await actAsync(async () => {
      expect(await submit(input)).toBeUndefined();
    });
    expect(screen.getByText("Unable to save changes. Try again.")).toBeVisible();
    await actAsync(async () => {
      expect(await submit(input)).toEqual(input.values);
    });
    expect(editCard).toHaveBeenLastCalledWith("opening-user", { id: "card-id", ...input.values }, expect.any(Function));
  });

  it.each([false, true])("handles a later local failure with a user guard (changed: %s)", async (changedUser) => {
    render(<ToastViewport />);
    const values = { frontText: "Saved locally", backText: "Back", tags: [] };
    await actAsync(async () => {
      expect(await submit({ cardId: "card-id", values })).toEqual(values);
    });
    const onLocalError = vi.mocked(editCard).mock.calls[0]?.[2];
    expect(onLocalError).toBeTypeOf("function");
    if (changedUser) session.uid = "another-user";
    await actAsync(async () => {
      onLocalError?.(new Error("local persistence failed"));
      await Promise.resolve();
    });
    expect(screen.queryAllByRole("alert")).toHaveLength(changedUser ? 0 : 1);
  });
});

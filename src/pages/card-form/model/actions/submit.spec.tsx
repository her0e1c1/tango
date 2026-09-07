import { render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { editCard } from "@/entities/card";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createCard } from "@/test/factories";

import { useCardFormPageModel } from "../useCardFormPageModel";
import { submit } from "./submit";

const session = vi.hoisted(() => ({ uid: "opening-user" as string | undefined }));
vi.mock("@/entities/auth", () => ({
  getAuthSession: () =>
    session.uid === undefined ? { status: "unauthenticated" } : { status: "authenticated", uid: session.uid },
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  editCard: vi.fn(),
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-03 CARD-09 card form submission", () => {
  beforeEach(() => {
    dismissToast();
    vi.mocked(editCard).mockReset();
    session.uid = "opening-user";
  });

  it.each(["saving-user", undefined])(
    "uses the session at submission (%s) and sends only editable content",
    async (uid) => {
      const card = createCard({ tags: ["custom-tag"], uid: "owner" });
      const { result } = renderHook(() => useCardFormPageModel(card));
      render(<ToastViewport />);
      session.uid = uid;
      const values = { ...result.current.form.getValues(), frontText: "Edited front", backText: "Edited back" };
      let saved: boolean | undefined;
      await actAsync(async () => {
        saved = await result.current.submit(values);
      });

      expect(saved).toBe(true);
      expect(editCard).toHaveBeenCalledWith(uid ?? "", {
        id: card.id,
        frontText: "Edited front",
        backText: "Edited back",
        tags: ["custom-tag"],
      });
      expect(screen.getByText("Updated card “Edited front”.")).toBeVisible();
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

    await expect(saved).resolves.toBe(true);
    expect(screen.getByText("Updated card “Submitted”.")).toBeVisible();
  });

  it("returns false with shared feedback on failure and retries the same Card", async () => {
    vi.mocked(editCard).mockRejectedValueOnce(new Error("write failed"));
    render(<ToastViewport />);
    const input = { cardId: "card-id", values: { frontText: "Retry", backText: "Back", tags: [] } };
    await actAsync(async () => {
      expect(await submit(input)).toBe(false);
    });
    expect(screen.getByText("Unable to save changes. Try again.")).toBeVisible();
    await actAsync(async () => {
      expect(await submit(input)).toBe(true);
    });
    expect(editCard).toHaveBeenLastCalledWith("opening-user", { id: "card-id", ...input.values });
    expect(screen.getByText("Updated card “Retry”.")).toBeVisible();
  });
});

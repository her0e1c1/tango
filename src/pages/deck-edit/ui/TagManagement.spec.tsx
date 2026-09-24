import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { TagManagement } from "./TagManagement";

function Harness({
  hideShared = false,
  disabled = false,
  deletionCompleted = false,
}: {
  hideShared?: boolean;
  disabled?: boolean;
  deletionCompleted?: boolean;
}) {
  const [tags, setTags] = useState(["shared", "kept"]);
  const [editingTag, setEditingTag] = useState<string>();
  const [deletion, setDeletion] = useState<string>();
  const addForm = useForm({ defaultValues: { name: "" } });
  const renameForm = useForm({ defaultValues: { name: "" } });
  return (
    <TagManagement
      tags={hideShared ? tags.filter((tag) => tag !== "shared") : tags}
      usageCounts={
        new Map([
          ["shared", 2],
          ["kept", 1],
        ])
      }
      addForm={addForm}
      renameForm={renameForm}
      editingTag={editingTag}
      deletion={deletionCompleted ? undefined : deletion}
      disabled={disabled}
      error={undefined}
      onAdd={addForm.handleSubmit(({ name }) => {
        setTags([...tags, name]);
        addForm.reset();
      })}
      onRename={renameForm.handleSubmit(({ name }) => {
        setTags(tags.map((tag) => (tag === editingTag ? name : tag)));
        setEditingTag(undefined);
      })}
      onEdit={(tag) => {
        renameForm.reset({ name: tag });
        setEditingTag(tag);
      }}
      onCancelEdit={() => setEditingTag(undefined)}
      onDelete={setDeletion}
      onCancelDeletion={() => setDeletion(undefined)}
      onConfirmDeletion={() => {
        setTags(tags.filter((tag) => tag !== deletion));
        setDeletion(undefined);
        return Promise.resolve();
      }}
    />
  );
}

describe("DECK-TAG-MANAGEMENT-01 DECK-TAG-MANAGEMENT-06 DECK-TAG-MANAGEMENT-09 DECK-TAG-MANAGEMENT-10 DECK-TAG-MANAGEMENT-18 tag management", () => {
  it("exposes directly accessible icon actions and card usage", () => {
    render(<Harness />);
    const row = within(screen.getByRole("listitem", { name: "shared" }));
    expect(row.getByText("Used by 2 cards")).toBeVisible();
    expect(row.getByRole("button", { name: "Rename shared" }).textContent).toBe("");
    expect(row.getByRole("button", { name: "Delete tag shared" }).textContent).toBe("");
  });

  it("opens inline editing immediately and restores focus when cancelled", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Rename shared" }));
    const input = screen.getByRole("textbox", { name: "New name" });
    expect(input).toHaveFocus();
    expect(input).toHaveValue("shared");
    expect(screen.getByRole("button", { name: "Rename kept" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Rename shared" })).toHaveFocus();
  });

  it("saves a renamed tag and keeps a usable focus target", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Rename shared" }));
    const input = screen.getByRole("textbox", { name: "New name" });
    await userEvent.clear(input);
    await userEvent.type(input, "renamed");
    await userEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(screen.getByRole("button", { name: "Rename renamed" })).toBeEnabled();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "New tag name" })).toHaveFocus());
  });

  it("confirms deletion in the target row and returns focus on cancellation", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Delete tag shared" }));
    const row = within(screen.getByRole("listitem", { name: "shared" }));
    const confirmation = within(row.getByRole("group", { name: "Delete tag?" }));
    expect(confirmation.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Delete tag kept" })).toBeDisabled();
    await userEvent.click(confirmation.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Delete tag shared" })).toHaveFocus();
    expect(screen.queryByRole("group", { name: "Delete tag?" })).not.toBeInTheDocument();
  });

  it.each(["Rename shared", "Delete tag shared"])(
    "allows cancellation when an active tag disappears after %s",
    async (action) => {
      const view = render(<Harness />);
      await userEvent.click(screen.getByRole("button", { name: action }));
      view.rerender(<Harness hideShared />);
      const cancel = screen.getByRole("button", { name: "Cancel" });
      expect(cancel).toHaveFocus();
      await userEvent.click(cancel);
      expect(screen.getByRole("button", { name: "Rename kept" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Add tag" })).toBeEnabled();
      expect(screen.getByRole("textbox", { name: "New tag name" })).toHaveFocus();
    }
  );

  it("restores focus after a completed deletion releases the pending input lock", async () => {
    const view = render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Delete tag shared" }));
    view.rerender(<Harness disabled />);
    view.rerender(<Harness disabled hideShared deletionCompleted />);
    expect(screen.getByRole("textbox", { name: "New tag name" })).toBeDisabled();
    view.rerender(<Harness hideShared deletionCompleted />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "New tag name" })).toHaveFocus());
  });

  it("removes a confirmed tag and focuses the add field", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Delete tag shared" }));
    const confirmation = within(screen.getByRole("group", { name: "Delete tag?" }));
    await userEvent.click(confirmation.getByRole("button", { name: "Delete tag" }));
    expect(screen.queryByRole("listitem", { name: "shared" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename kept" })).toBeEnabled();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "New tag name" })).toHaveFocus());
  });
});

import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { cardContentSchema } from "@/entities/card";

import { CardFields, type CardFormFields } from "./CardFields";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const initialValues: CardFormFields = { frontText: "Front", backText: "Back", tags: ["language", "custom"] };

const FormHarness = ({ onSubmit = vi.fn() }: { onSubmit?: (values: CardFormFields) => void }) => {
  const form = useForm<CardFormFields>({
    defaultValues: initialValues,
    resolver: zodResolver(cardContentSchema.omit({ uniqueKey: true })),
  });
  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values))}>
      <CardFields categories={["language", "math"]} form={form} />
      <button type="submit">Save</button>
    </form>
  );
};

describe("CARD-03 CardFields editing", () => {
  it("keeps both drafts across tabs and expanded editing, then submits the selected tags", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    expect(screen.queryByRole("textbox", { name: "Back text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Front text" }));
    await user.type(screen.getByRole("textbox", { name: "Front text" }), "Updated front");
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const editor = screen.getByRole("dialog", { name: "Back text" });
    const expandedInput = within(editor).getByRole("textbox", { name: "Back text" });
    await user.clear(expandedInput);
    await user.type(expandedInput, "Updated back");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand Back" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Updated back");
    await user.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Updated front");

    const tagsTrigger = screen.getByRole("button", { name: "Edit tags" });
    await user.click(tagsTrigger);
    const tagsDialog = screen.getByRole("dialog", { name: "Select tags" });
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "custom" }));
    expect(within(tagsDialog).getByRole("checkbox", { name: "custom" })).not.toBeChecked();
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "custom" }));
    await user.click(within(tagsDialog).getByRole("checkbox", { name: "math" }));
    await user.click(within(tagsDialog).getByRole("button", { name: "Done" }));
    expect(tagsTrigger).toHaveFocus();
    expect(tagsTrigger).toHaveTextContent("+1");
    expect(tagsTrigger).toHaveAccessibleDescription("language, custom, math");
    await user.click(tagsTrigger);
    expect(screen.getByRole("checkbox", { name: "math" })).toBeChecked();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith({
      frontText: "Updated front",
      backText: "Updated back",
      tags: ["language", "custom", "math"],
    });
  });

  it("switches sides with arrow and endpoint keys while keeping tab focus", async () => {
    const user = userEvent.setup();
    render(<FormHarness />);
    const front = screen.getByRole("tab", { name: "Front" });
    const back = screen.getByRole("tab", { name: "Back" });
    await user.click(front);
    await user.keyboard("{ArrowRight}");
    expect(back).toHaveFocus();
    expect(back).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back");
    await user.keyboard("{Home}");
    expect(front).toHaveFocus();
    await user.keyboard("{End}");
    expect(back).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(front).toHaveFocus();
  });
});

describe("CARD-21 CardFields validation", () => {
  it("reveals and focuses an invalid Back while preserving the valid Front", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    await user.click(screen.getByRole("tab", { name: "Back" }));
    await user.clear(screen.getByRole("textbox", { name: "Back text" }));
    await user.click(screen.getByRole("tab", { name: "Front" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Back text is required.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Back" })).toHaveAttribute("aria-selected", "true");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Expand Back" }));
    const editor = screen.getByRole("dialog", { name: "Back text" });
    const expandedInput = within(editor).getByRole("textbox", { name: "Back text" });
    expect(expandedInput).toBeInvalid();
    expect(expandedInput).toHaveAccessibleDescription("Back text is required.");
    expect(within(editor).getByRole("alert")).toHaveTextContent("Back text is required.");
    expect(within(editor).getByRole("alert")).toBeVisible();
    await user.click(within(editor).getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front");
  });
});

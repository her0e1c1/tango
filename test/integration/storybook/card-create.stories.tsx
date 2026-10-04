import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { createCard } from "@/entities/card";
import { routeMeta, state, deck } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Card create",
  parameters: { ...routeMeta.parameters, page: { ...state, cards: [], path: `/deck/${deck.id}/card/new` } },
};
export default meta;
type Story = StoryObj<typeof meta>;
type Play = Parameters<NonNullable<Story["play"]>>[0];
async function fill({ canvas, userEvent }: Play, front = "Hello", back = "Hola") {
  await userEvent.type(await canvas.findByRole("textbox", { name: "Front text" }), front);
  await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
  await userEvent.type(canvas.getByRole("textbox", { name: "Back text" }), back);
}
export const Create: Story = {
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-05 Create a card and read it from the target deck", async () => {
      await fill(context);
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("button", { name: "Add tag" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Tag name 1" }), " new tag ");
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent(
        "Created card “Hello”."
      );
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      await expect(within(canvas.getByRole("article")).getByText("new tag", { exact: true })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "View Hello" }));
      await expect(await canvas.findByRole("button", { name: "Close card" })).toHaveTextContent("Hola");
    });
  },
};
export const SuccessNotification: Story = {
  play: async (context) => {
    await context.step("STORYBOOK-CARD-FORM-17 Announce the created card after success", async () => {
      await fill(context, "Front value", "Back value");
      await context.userEvent.click(context.canvas.getByRole("button", { name: "Create card" }));
      await expect(await context.canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent(
        "Created card “Front value”."
      );
    });
  },
};
export const Retry: Story = {
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-18 Retain both sides after failure and retry", async () => {
      mocked(createCard).mockRejectedValueOnce(new Error("Storage unavailable"));
      await fill(context);
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to create this card. Try again.");
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Hola");
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Hello");
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      await expect(canvas.getByRole("status", { name: "Toast notifications" })).toHaveTextContent(
        "Created card “Hello”."
      );
    });
  },
};
export const Pending: Story = {
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-19 Prevent duplicate creation while waiting", async () => {
      const pending = Promise.withResolvers<void>();
      const persist = mocked(createCard).getMockImplementation()!;
      mocked(createCard).mockImplementationOnce(async (...args) => {
        await pending.promise;
        await persist(...args);
      });
      try {
        await fill(context);
        await userEvent.dblClick(canvas.getByRole("button", { name: "Create card" }));
        await expect(canvas.getByRole("button", { name: "Creating…" })).toBeDisabled();
        pending.resolve();
        await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
        await expect(canvas.getAllByText("Hello", { exact: true })).toHaveLength(1);
        await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
        await userEvent.click(canvas.getByRole("menuitem", { name: "Add card" }));
        await expect(await canvas.findByRole("button", { name: "Create card" })).toBeEnabled();
      } finally {
        pending.resolve();
      }
    });
  },
};
export const Required: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-CREATE-01 Reject empty sides without a success notification", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Create card" }));
      await expect(await canvas.findByText("Front text is required.")).toBeVisible();
      await expect(canvas.queryByText(/Created card/)).not.toBeInTheDocument();
      await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Fixed");
      await expect(canvas.getByRole("button", { name: "Create card" })).toBeEnabled();
    });
  },
};
export const Preview: Story = {
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-CREATE-02 Preview the unsaved answer and retain the draft", async () => {
      const back = "**Strong answer** $x^2$";
      await fill(context, "Draft", back);
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      await expect(preview.querySelector("strong")).toHaveTextContent("Strong answer");
      await expect(preview.querySelector(".katex")).toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Hide preview" }));
      await waitFor(() => expect(canvas.queryByRole("region", { name: "Answer preview" })).not.toBeInTheDocument());
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue(back);
      await expect(canvas.queryByText(/Created card/)).not.toBeInTheDocument();
    });
  },
};

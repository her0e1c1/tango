import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { createCard } from "@/entities/card";
import { routeMeta, state, deck } from "./support";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-05 Create a card and read it from the target deck", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await fill(context);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Edit tags" }));
      await userEvent.click(canvas.getByRole("button", { name: "Add tag" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Tag name 1" }), " new tag ");
      await userEvent.click(within(canvas.getByRole("dialog")).getByText("new tag", { exact: true }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("textbox", { name: "Tag name 1" })).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Add tag" }));
      await userEvent.type(canvas.getByRole("textbox", { name: "Tag name 1" }), " new tag ");
      await userEvent.keyboard("{Escape}");
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent(
        "Created card “Hello”."
      );
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      await expect(within(canvas.getByRole("article")).getByText("new tag", { exact: true })).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "View Hello" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "Close card" })).toHaveTextContent("Hola");
    });
  },
};
export const SuccessNotification: Story = {
  play: async (context) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await context.step("STORYBOOK-CARD-FORM-17 Announce the created card after success", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await fill(context, "Front value", "Back value");
      // When: Exercise `context.userEvent.click` with the prepared inputs.
      await context.userEvent.click(context.canvas.getByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await context.canvas.findByRole("status", { name: "Toast notifications" })).toHaveTextContent(
        "Created card “Front value”."
      );
    });
  },
};
export const Retry: Story = {
  play: async (context) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-18 Retain both sides after failure and retry", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      mocked(createCard).mockRejectedValueOnce(new Error("Storage unavailable"));
      await fill(context);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to create this card. Try again.");
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Hola");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("tab", { name: "Front" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Hello");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
      await expect(canvas.getByRole("status", { name: "Toast notifications" })).toHaveTextContent(
        "Created card “Hello”."
      );
    });
  },
};
export const Pending: Story = {
  play: async (context) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-FORM-19 Prevent duplicate creation while waiting", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const pending = Promise.withResolvers<void>();
      const persist = mocked(createCard).getMockImplementation()!;
      mocked(createCard).mockImplementationOnce(async (...args) => {
        await pending.promise;
        await persist(...args);
      });
      try {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        await fill(context);
        // When: Exercise `userEvent.dblClick` with the prepared inputs.
        await userEvent.dblClick(canvas.getByRole("button", { name: "Create card" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("button", { name: "Creating…" })).toBeDisabled();
        // When: Apply the operation or event under test.
        pending.resolve();
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("heading", { name: "Cards" })).toBeVisible();
        await expect(canvas.getAllByText("Hello", { exact: true })).toHaveLength(1);
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
        await userEvent.click(canvas.getByRole("menuitem", { name: "Add card" }));
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("button", { name: "Create card" })).toBeEnabled();
      } finally {
        pending.resolve();
      }
    });
  },
};
export const Required: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-CREATE-01 Reject empty sides without a success notification", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Create card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByText("Front text is required.")).toBeVisible();
      await expect(canvas.queryByText(/Created card/)).not.toBeInTheDocument();
      // When: Exercise `userEvent.type` with the prepared inputs.
      await userEvent.type(canvas.getByRole("textbox", { name: "Front text" }), "Fixed");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Create card" })).toBeEnabled();
    });
  },
};
export const Preview: Story = {
  play: async (context) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const { canvas, userEvent, step } = context;
    await step("STORYBOOK-CARD-CREATE-02 Preview the unsaved answer and retain the draft", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const back = "**Strong answer** $x^2$";
      await fill(context, "Draft", back);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Preview answer" }));
      const preview = canvas.getByRole("region", { name: "Answer preview" });
      // Then: Verify the expected result in the assertions below.
      await expect(preview.querySelector("strong")).toHaveTextContent("Strong answer");
      await expect(preview.querySelector(".katex")).toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Hide preview" }));
      // Then: Verify the expected result in the assertions below.
      await waitFor(() => expect(canvas.queryByRole("region", { name: "Answer preview" })).not.toBeInTheDocument());
      await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue(back);
      await expect(canvas.queryByText(/Created card/)).not.toBeInTheDocument();
    });
  },
};

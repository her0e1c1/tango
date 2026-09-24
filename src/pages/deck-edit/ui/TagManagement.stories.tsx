import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { fn } from "storybook/test";

import { TagManagement } from "./TagManagement";

function TagManagementStory(args: Omit<ComponentProps<typeof TagManagement>, "addForm" | "renameForm">) {
  const addForm = useForm({ defaultValues: { name: "" } });
  const renameForm = useForm({ defaultValues: { name: args.editingTag ?? "" } });
  return <TagManagement {...args} addForm={addForm} renameForm={renameForm} />;
}

const meta = {
  title: "Pages/Deck Edit/TagManagement",
  component: TagManagementStory,
  tags: ["autodocs"],
  args: {
    tags: ["shared", "kept"],
    usageCounts: new Map([
      ["shared", 2],
      ["kept", 1],
    ]),
    editingTag: undefined,
    error: undefined,
    disabled: false,
    pending: false,
    deletion: undefined,
    onAdd: fn(),
    onRename: fn(),
    onEdit: fn(),
    onCancelEdit: fn(),
    onDelete: fn(),
    onCancelDeletion: fn(),
    onConfirmDeletion: fn(async () => undefined),
  },
} satisfies Meta<typeof TagManagementStory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { tags: [] } };
export const Editing: Story = { args: { editingTag: "shared" } };
export const Required: Story = { args: { error: "required" } };
export const Duplicate: Story = { args: { editingTag: "shared", error: "duplicate" } };
export const Pending: Story = { args: { pending: true, disabled: true } };
export const DeleteConfirmation: Story = { args: { deletion: "shared" } };
export const Mobile: Story = {
  args: { tags: ["shared", "kept", "A very long tag name that should wrap without moving its actions", "unused"] },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const MobileEditing: Story = { ...Mobile, args: { ...Mobile.args, editingTag: "shared" } };
export const MobileDeletion: Story = { ...Mobile, args: { ...Mobile.args, deletion: "shared" } };
export const Dark: Story = { globals: { theme: "dark" } };

export const RemovedEditingTag: Story = { args: { tags: ["kept"], editingTag: "shared" } };
export const RemovedDeletionTag: Story = { args: { tags: ["kept"], deletion: "shared" } };

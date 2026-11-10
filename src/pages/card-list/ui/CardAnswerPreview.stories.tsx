import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { fn } from "storybook/test";
import { BackText } from "@/entities/card";
import { CardAnswerPreview } from "./CardAnswerPreview";

const PreviewExample: React.FC<React.ComponentProps<typeof CardAnswerPreview>> = (props) => {
  const [open, setOpen] = React.useState(true);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const restoreTriggerFocus = () => triggerRef.current?.focus();
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open answer
      </button>
      {open ? (
        <CardAnswerPreview
          {...props}
          onClose={() => {
            props.onClose();
            setOpen(false);
          }}
          restoreTriggerFocus={restoreTriggerFocus}
        />
      ) : null}
    </>
  );
};

const meta = {
  title: "Pages/Card List/CardAnswerPreview",
  component: CardAnswerPreview,
  render: (args) => <PreviewExample {...args} />,
  args: {
    title: "Card question",
    children: <BackText category="raw" text="A selectable answer." />,
    onClose: fn(),
    restoreTriggerFocus: fn(),
  },
} satisfies Meta<typeof CardAnswerPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {};
export const LongText: Story = {
  args: {
    title: "Long question ".repeat(60),
    children: <BackText category="raw" text={"Long answer\n".repeat(100)} />,
  },
};
export const Code: Story = {
  args: { children: <BackText category="typescript" code text={`const answer = '${"wide ".repeat(80)}';`} /> },
};
export const MarkdownAndMath: Story = {
  args: {
    children: (
      <BackText
        category="math"
        text={"# Answer\n\nA [reference](#user-content-fn-1) and note[^1].\n\n$$\nE = mc^2\n$$\n\n[^1]: A footnote."}
      />
    ),
  },
};
export const Narrow: Story = { ...LongText, globals: { viewport: { value: "iphone5", isRotated: false } } };
export const Dark: Story = { ...MarkdownAndMath, globals: { theme: "dark" } };

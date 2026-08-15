import { useButtonInteraction } from "./buttonInteraction";

export function TestButton({ onClick }: { onClick?: () => void }) {
  const props = useButtonInteraction(onClick);
  return <div {...props}>Test Button</div>;
}

export function NestedTestButton({ onClick }: { onClick?: () => void }) {
  const props = useButtonInteraction(onClick);
  return (
    <div {...props}>
      <input aria-label="Nested input" />
    </div>
  );
}

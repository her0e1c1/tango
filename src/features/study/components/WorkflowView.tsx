import type { StudyWorkflowState } from "./StudyWorkflow";

export const WorkflowView = ({ state }: { state: StudyWorkflowState }) => {
  if (state.status !== "ready") return <div>{state.status}</div>;
  return (
    <div>
      <div>{state.card.id}</div>
      <div data-testid="back">{String(state.showBackText)}</div>
      <div data-testid="autoplay">{String(state.controller.autoPlay)}</div>
      <div data-testid="index">{state.controller.index}</div>
      <div data-testid="feedback">{state.swipeFeedback ?? "none"}</div>
      <button type="button" onClick={state.shortcutActions.toggleShowBackText}>
        toggle back
      </button>
      <button type="button" onClick={state.actions.swipeLeft}>
        swipe left
      </button>
      <button type="button" onClick={state.shortcutActions.swipeRight}>
        swipe right
      </button>
    </div>
  );
};

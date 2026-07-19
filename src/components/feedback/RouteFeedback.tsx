import type * as React from "react";

import { Button, type ButtonVariant } from "@/components/forms/Button";
import { Layout } from "@/components/layout/Layout";

export type RouteFeedbackTone = "loading" | "error" | "not-found";

export interface RouteFeedbackAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

export interface RouteFeedbackProps {
  title: string;
  description?: string;
  tone?: RouteFeedbackTone;
  primaryAction?: RouteFeedbackAction;
  secondaryAction?: RouteFeedbackAction;
}

const ActionButton = ({ action, defaultVariant }: { action: RouteFeedbackAction; defaultVariant: ButtonVariant }) => (
  <Button variant={action.variant ?? defaultVariant} onClick={action.onClick}>
    {action.label}
  </Button>
);

export const RouteFeedback: React.FC<RouteFeedbackProps> = (props) => {
  const tone = props.tone ?? "loading";
  const role = tone === "error" ? "alert" : "status";

  return (
    <Layout>
      <section
        role={role}
        aria-live={tone === "error" ? "assertive" : "polite"}
        className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 text-center text-ink shadow-surface md:p-6"
      >
        <h1 className="text-title font-bold">{props.title}</h1>
        {props.description ? <p className="mt-2 text-body text-ink-muted">{props.description}</p> : null}
        {props.primaryAction || props.secondaryAction ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {props.secondaryAction ? <ActionButton action={props.secondaryAction} defaultVariant="quiet" /> : null}
            {props.primaryAction ? <ActionButton action={props.primaryAction} defaultVariant="primary" /> : null}
          </div>
        ) : null}
      </section>
    </Layout>
  );
};

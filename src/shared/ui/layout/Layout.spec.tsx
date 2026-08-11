/**
 * @file Verifies the "shared app shell" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps Outer as the standard
 * dynamic-viewport scroll owner", "renders Main as a bounded semantic content surface", "renders
 * the standard branch in shell order and ignores fullscreen-only interaction props".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { List } from "@/shared/ui/layout/List";
import { Main } from "@/shared/ui/main";
import { Outer } from "@/shared/ui/outer";

import { Layout } from "./Layout";

const fixedHeaderOffsetClass = "pt-[calc(var(--spacing-touch)+1rem+env(safe-area-inset-top))]";

describe("shared app shell", () => {
  it("keeps Outer as the standard dynamic-viewport scroll owner", () => {
    render(<Outer className="custom-shell">Outer content</Outer>);
    const outer = screen.getByText("Outer content");

    expect(outer).toHaveClass(
      "h-dvh",
      "min-h-dvh",
      "overflow-x-hidden",
      "overflow-y-auto",
      "bg-canvas",
      "custom-shell"
    );
    expect(outer).not.toHaveClass("h-screen", "w-screen");
  });

  it("renders Main as a bounded semantic content surface", () => {
    render(<Main>Main content</Main>);
    const main = screen.getByText("Main content");

    expect(main).toHaveClass(
      "w-full",
      "max-w-content",
      "bg-surface",
      "text-ink",
      "px-shell-gutter",
      "py-section-gap",
      "rounded-surface",
      "shadow-surface"
    );
  });

  it("renders the standard branch in shell order and ignores fullscreen-only interaction props", () => {
    const onClick = vi.fn();
    render(
      <Layout showHeader scroll onClick={onClick}>
        <span>Standard content</span>
      </Layout>
    );
    const content = screen.getByText("Standard content");

    expect(screen.getByText("tango")).toBeInTheDocument();
    expect(content).toBeVisible();
    fireEvent.click(content);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders the fullscreen branch without Main or the bottom spacer", () => {
    const onClick = vi.fn();
    render(
      <Layout fullscreen showHeader scroll onClick={onClick}>
        <span>Fullscreen content</span>
      </Layout>
    );
    const fullScreen = screen.getByRole("button", { name: /Fullscreen content/ });
    const content = screen.getByText("Fullscreen content");

    expect(fullScreen).not.toHaveClass(fixedHeaderOffsetClass);
    expect(fullScreen).toHaveClass("overflow-x-hidden", "overflow-y-auto");

    fireEvent.click(content);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps standard content visible below a fixed Header", () => {
    render(
      <Layout showHeader fixedHeader>
        <span>Standard fixed content</span>
      </Layout>
    );
    const content = screen.getByText("Standard fixed content");

    expect(screen.getByText("tango")).toBeInTheDocument();
    expect(content).toBeVisible();
  });

  it("bounds an h-full child below the fixed Header without adding a fullscreen sibling", () => {
    render(
      <Layout fullscreen showHeader fixedHeader>
        <div className="h-full">Fullscreen fixed content</div>
      </Layout>
    );
    const content = screen.getByText("Fullscreen fixed content");

    expect(screen.getByText("tango")).toBeInTheDocument();
    expect(content).toHaveClass("h-full");
  });

  it("keeps flex precedence and the one/two/three-column List modes", () => {
    const view = render(
      <List flex col1>
        List content
      </List>
    );
    const list = screen.getByText("List content");

    expect(list).toHaveClass("flex", "flex-wrap", "gap-section-gap");
    expect(list).not.toHaveClass("grid", "grid-cols-1");

    view.rerender(<List col1>List content</List>);
    expect(screen.getByText("List content")).toHaveClass("grid", "grid-cols-1", "gap-section-gap");
    expect(screen.getByText("List content")).not.toHaveClass("md:grid-cols-2", "lg:grid-cols-3");

    view.rerender(<List>List content</List>);
    expect(screen.getByText("List content")).toHaveClass(
      "grid",
      "grid-cols-1",
      "gap-section-gap",
      "md:grid-cols-2",
      "lg:grid-cols-3"
    );
  });
});

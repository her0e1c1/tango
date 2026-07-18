import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Layout } from "@/components/layout/Layout";
import { List } from "@/components/layout/List";
import { Main } from "@/components/layout/Main";
import { Outer } from "@/components/layout/Outer";

afterEach(cleanup);

const fixedHeaderOffsetClass = "pt-[calc(var(--spacing-touch)+1rem+env(safe-area-inset-top))]";

describe("shared app shell", () => {
  it("keeps Outer as the standard dynamic-viewport scroll owner", () => {
    const view = render(<Outer className="custom-shell">Outer content</Outer>);
    const outer = view.getByText("Outer content");

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
    const view = render(<Main>Main content</Main>);
    const main = view.getByText("Main content");

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
    const view = render(
      <Layout showHeader scroll onClick={onClick}>
        <span>Standard content</span>
      </Layout>
    );
    const outer = view.container.firstElementChild;
    const content = view.getByText("Standard content");

    expect(outer).not.toBeNull();
    expect(outer?.children).toHaveLength(3);
    expect(outer?.children[0]).toHaveTextContent("tango");
    expect(outer?.children[1]).toContainElement(content);
    expect(outer).not.toHaveClass(fixedHeaderOffsetClass);
    expect(outer?.children[2]).toHaveClass("pb-[calc(var(--spacing-section-gap)+env(safe-area-inset-bottom))]");

    fireEvent.click(content);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders the fullscreen branch without Main or the bottom spacer", () => {
    const onClick = vi.fn();
    const view = render(
      <Layout fullscreen showHeader scroll onClick={onClick}>
        <span>Fullscreen content</span>
      </Layout>
    );
    const fullScreen = view.container.firstElementChild;
    const content = view.getByText("Fullscreen content");

    expect(fullScreen).not.toBeNull();
    expect(fullScreen?.children).toHaveLength(2);
    expect(fullScreen?.children[0]).toHaveTextContent("tango");
    expect(content.parentElement).toBe(fullScreen);
    expect(fullScreen).not.toHaveClass(fixedHeaderOffsetClass);
    expect(fullScreen).toHaveClass("overflow-x-hidden", "overflow-y-auto");
    expect(fullScreen?.querySelector(".max-w-content")).not.toBeInTheDocument();

    fireEvent.click(content);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("reserves the fixed Header height on Outer without adding a standard-branch sibling", () => {
    const view = render(
      <Layout showHeader fixedHeader>
        <span>Standard fixed content</span>
      </Layout>
    );
    const outer = view.container.firstElementChild;
    const logo = view.getByText("tango").closest("div");
    const header = logo?.parentElement;
    const content = view.getByText("Standard fixed content");

    expect(logo).not.toBeNull();
    expect(outer).toHaveClass(fixedHeaderOffsetClass);
    expect(outer?.children).toHaveLength(3);
    expect(outer?.children[0]).toBe(header);
    expect(outer?.children[1]).toContainElement(content);
    expect(header?.nextElementSibling).toBe(outer?.children[1]);
    expect(outer?.children[2]).toHaveClass("pb-[calc(var(--spacing-section-gap)+env(safe-area-inset-bottom))]");
  });

  it("bounds an h-full child below the fixed Header without adding a fullscreen sibling", () => {
    const view = render(
      <Layout fullscreen showHeader fixedHeader>
        <div className="h-full">Fullscreen fixed content</div>
      </Layout>
    );
    const fullScreen = view.container.firstElementChild;
    const logo = view.getByText("tango").closest("div");
    const header = logo?.parentElement;
    const content = view.getByText("Fullscreen fixed content");

    expect(logo).not.toBeNull();
    expect(fullScreen).toHaveClass("h-dvh", "overflow-hidden", fixedHeaderOffsetClass);
    expect(fullScreen?.children).toHaveLength(2);
    expect(fullScreen?.children[0]).toBe(header);
    expect(fullScreen?.children[1]).toBe(content);
    expect(header?.nextElementSibling).toBe(content);
    expect(content).toHaveClass("h-full");
  });

  it("lets headerProps.fixed override fixedHeader", () => {
    const view = render(<Layout showHeader fixedHeader headerProps={{ fixed: false }} />);
    const logo = view.getByText("tango").closest("div");
    const header = logo?.parentElement;
    const outer = view.container.firstElementChild;

    expect(logo).not.toBeNull();
    expect(header).not.toBeNull();
    expect(header).not.toHaveClass("fixed");
    expect(outer?.children).toHaveLength(3);
    expect(outer).not.toHaveClass(fixedHeaderOffsetClass);

    view.rerender(<Layout showHeader fixedHeader={false} headerProps={{ fixed: true }} />);
    expect(view.getByText("tango").closest("div")?.parentElement).toHaveClass("fixed");
    expect(view.container.firstElementChild).toHaveClass(fixedHeaderOffsetClass);
    expect(view.container.firstElementChild?.children).toHaveLength(3);
  });

  it("keeps flex precedence and the one/two/three-column List modes", () => {
    const view = render(
      <List flex col1>
        List content
      </List>
    );
    const list = view.getByText("List content");

    expect(list).toHaveClass("flex", "flex-wrap", "gap-section-gap");
    expect(list).not.toHaveClass("grid", "grid-cols-1");

    view.rerender(<List col1>List content</List>);
    expect(view.getByText("List content")).toHaveClass("grid", "grid-cols-1", "gap-section-gap");
    expect(view.getByText("List content")).not.toHaveClass("md:grid-cols-2", "lg:grid-cols-3");

    view.rerender(<List>List content</List>);
    expect(view.getByText("List content")).toHaveClass(
      "grid",
      "grid-cols-1",
      "gap-section-gap",
      "md:grid-cols-2",
      "lg:grid-cols-3"
    );
  });
});

/**
 * @file Verifies the "keyboard-accessible interactions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "activates FrontText with
 * Enter", "activates swipe actions with Enter".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FrontText } from "@/features/card/components/FrontText";
import { SwipeButtonList } from "@/features/study/components/SwipeButtonList";
import { FullScreen, Logo, Overlay, Title } from "@/components";

describe("keyboard-accessible interactions", () => {
  it("activates FrontText with Enter", () => {
    const onClick = vi.fn();
    render(<FrontText text="Front" onClick={onClick} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Front" }), { key: "Enter" });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("activates swipe actions with Enter", async () => {
    const onClickLeft = vi.fn();
    const user = userEvent.setup();
    render(<SwipeButtonList onClickLeft={onClickLeft} />);

    screen.getByRole("button", { name: "Swipe left" }).focus();
    await user.keyboard("{Enter}");

    expect(onClickLeft).toHaveBeenCalledOnce();
  });

  it("activates Logo with Enter", () => {
    const onClick = vi.fn();
    render(<Logo onClick={onClick} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "tango" }), { key: "Enter" });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("activates Title with Enter", () => {
    const onClick = vi.fn();
    render(<Title onClick={onClick}>Title</Title>);

    fireEvent.keyDown(screen.getByRole("button", { name: "Title" }), { key: "Enter" });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("activates Overlay with Enter", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Enter" });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("activates a custom button once for a direct Enter key press", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );
    const button = screen.getByRole("button", { name: "Close" });

    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: "Enter", repeat: true });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("prevents scrolling on Space keydown and activates once on keyup", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );
    const button = screen.getByRole("button", { name: "Close" });

    expect(fireEvent.keyDown(button, { key: " " })).toBe(false);
    expect(fireEvent.keyDown(button, { key: " ", repeat: true })).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.keyUp(button, { key: " " });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("preserves a pending Space activation across rerenders", () => {
    const onClick = vi.fn();
    const view = render(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: " " });
    view.rerender(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );
    fireEvent.keyUp(screen.getByRole("button", { name: "Close" }), { key: " " });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("cancels a pending Space activation on blur", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );
    const button = screen.getByRole("button", { name: "Close" });

    fireEvent.keyDown(button, { key: " " });
    fireEvent.blur(button);
    fireEvent.keyUp(button, { key: " " });

    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not activate a custom button from descendant keyboard events", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick}>
        <input aria-label="Nested input" />
      </Overlay>
    );
    const input = screen.getByRole("textbox", { name: "Nested input" });

    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: " " });
    fireEvent.keyUp(input, { key: " " });

    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not expose non-interactive containers as buttons", () => {
    render(
      <>
        <FrontText text="Front" />
        <Logo />
        <Title>Title</Title>
        <Overlay position="center" ariaLabel="Decorative overlay">
          Overlay
        </Overlay>
        <FullScreen>Full screen</FullScreen>
      </>
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("Overlay")).not.toHaveAttribute("aria-label");
  });

  it("activates FullScreen with Enter", () => {
    const onClick = vi.fn();
    render(<FullScreen onClick={onClick}>Close</FullScreen>);

    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Enter" });

    expect(onClick).toHaveBeenCalledOnce();
  });
});

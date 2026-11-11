import { afterAll, beforeAll } from "vitest";

// jsdom can check Page wiring, but cannot certify native modal isolation, Escape or browser focus navigation.
const { prototype } = HTMLDialogElement;
const showModal = Object.getOwnPropertyDescriptor(prototype, "showModal");
const close = Object.getOwnPropertyDescriptor(prototype, "close");

beforeAll(() => {
  Object.defineProperty(prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
    },
  });
});

afterAll(() => {
  if (showModal === undefined) Reflect.deleteProperty(prototype, "showModal");
  else Object.defineProperty(prototype, "showModal", showModal);
  if (close === undefined) Reflect.deleteProperty(prototype, "close");
  else Object.defineProperty(prototype, "close", close);
});

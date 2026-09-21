import { getRecoveryMessages } from "./messages";
import { requestApplicationReset } from "./reset";

export function showStartupFailure(error: unknown): void {
  // biome-ignore lint/suspicious/noConsole: Preserve startup failure diagnostics when React cannot mount.
  console.error("Tango startup failed", error);
  const messages = getRecoveryMessages();
  document.documentElement.lang = messages.language;
  const section = document.createElement("section");
  section.setAttribute("role", "alert");
  section.className = "mx-auto max-w-reading rounded-surface border border-border bg-surface p-6 text-center text-ink";
  const heading = document.createElement("h1");
  heading.textContent = messages.title;
  heading.tabIndex = -1;
  heading.className = "text-title font-bold";
  const description = document.createElement("p");
  description.textContent = messages.description;
  description.className = "my-4";
  const reload = document.createElement("button");
  reload.type = "button";
  reload.textContent = messages.reload;
  reload.className = "m-2 rounded border border-border p-3";
  reload.onclick = () => window.location.reload();
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = messages.reset;
  reset.className = "m-2 rounded border border-border p-3";
  reset.onclick = () => requestApplicationReset(messages.language);
  section.append(heading, description, reload, reset);
  (document.getElementById("root") ?? document.body).replaceChildren(section);
  heading.focus();
}

import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/styles/index.css";

const scenarios = import.meta.glob<{ default: (params: URLSearchParams) => ReactNode }>("./scenarios/*.tsx");
const current = new URLSearchParams(location.search);
if (current.has("scenario")) sessionStorage.setItem("tango-integration-scenario", current.toString());
const params = current.has("scenario")
  ? current
  : new URLSearchParams(sessionStorage.getItem("tango-integration-scenario") ?? "");
const name = params.get("scenario");
const load = scenarios[`./scenarios/${name}.tsx`];
if (!load) throw new Error(`Unknown integration scenario: ${name}`);
const scenario = await load();
const root = document.getElementById("root");
if (!root) throw new Error("Integration root is missing");
createRoot(root).render(scenario.default(params));

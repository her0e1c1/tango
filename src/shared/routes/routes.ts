type StaticRoute = {
  path: string;
  to: () => string;
};

type IdRoute = {
  path: string;
  to: (id: string) => string;
};

const defineStaticRoute = (path: string): StaticRoute => ({
  path,
  to: () => path,
});

const defineIdRoute = (path: string): IdRoute => ({
  path,
  to: (id) => path.replace(":id", () => id),
});

// This is the deliberate domain-aware shared segment: the app route tree and lower layers must use
// the same path contract without reversing Feature-Sliced Design dependencies.
export const routes = {
  deckList: defineStaticRoute("/"),
  cardList: defineIdRoute("/deck/:id"),
  deckForm: defineIdRoute("/deck/:id/edit"),
  deckStudyStart: defineIdRoute("/deck/:id/start"),
  deckStudy: defineIdRoute("/deck/:id/study"),
  cardView: defineIdRoute("/card/:id"),
  cardForm: defineIdRoute("/card/:id/edit"),
  settings: defineStaticRoute("/settings"),
  deckImport: defineStaticRoute("/import"),
  notFound: { path: "*" },
} as const;

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

// Route matching and navigation must share one contract so path changes cannot leave generated
// destinations stale.
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

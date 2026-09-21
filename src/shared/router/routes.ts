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
  to: (id) => path.replace(":id", () => encodeURIComponent(id)),
});

// Route matching and navigation across higher layers share one technical contract in Shared so
// path changes cannot leave generated destinations stale or require upward FSD imports.
export const routes = {
  deckList: defineStaticRoute("/"),
  studyHistory: {
    path: "/study-history",
    to: (deckId?: string) =>
      deckId === undefined ? "/study-history" : `/study-history?${new URLSearchParams({ deckId }).toString()}`,
  },
  deckCreate: defineStaticRoute("/deck/new"),
  cardList: defineIdRoute("/deck/:id"),
  cardCreate: defineIdRoute("/deck/:id/card/new"),
  deckForm: defineIdRoute("/deck/:id/edit"),
  deckStudyStart: defineIdRoute("/deck/:id/start"),
  deckStudy: defineIdRoute("/deck/:id/study"),
  deckView: defineIdRoute("/deck/:id/view"),
  cardView: defineIdRoute("/card/:id"),
  cardForm: defineIdRoute("/card/:id/edit"),
  account: defineStaticRoute("/account"),
  settings: defineStaticRoute("/settings"),
  deckImport: defineStaticRoute("/import"),
  notFound: { path: "*" },
} as const;

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BackText, cardContentInputSchema, getCards, useCard, type Card } from "@/entities/card";
import { CATEGORY, getDecks } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import { useCardPreviewContent, type CardFormFields } from "@/features/card-form";
import { useCardEditPageModel } from "@/pages/card-edit/model/useCardEditPageModel";
import { CardEditor } from "@/pages/card-edit/ui/CardEditor";
import { CardCreator } from "@/pages/card-create/ui/CardCreator";
import { submit } from "@/pages/card-create/model/actions/submit";
import { AppLayout } from "@/widgets/app-layout";
import { createCard, createDeck } from "@/test/factories";
import { replaceRemoteCards } from "@/test/utils/entityFixtures";
import { useCardTagForm } from "@/test/useCardTagForm";
import { io, now, prepareApp, renderRoutes, uid } from "../support";

const deck = createDeck({
  id: "form-deck",
  uid,
  name: "Japanese verbs",
  category: "math",
  createdAt: now,
  updatedAt: now,
});
const card = createCard({
  id: "form-card",
  uid,
  deckId: deck.id,
  uniqueKey: "form-key",
  frontText: "Front",
  backText: "Back",
  tags: ["language", "custom"],
  createdAt: now,
  updatedAt: now,
});
const candidate = createCard({
  id: "form-candidate",
  uid,
  deckId: deck.id,
  uniqueKey: "form-candidate-key",
  frontText: "Candidate",
  backText: "Candidate answer",
  tags: ["raw", "math", "python", "md", "typescript"],
  createdAt: now,
  updatedAt: now,
});
const mathDraft = "**Draft**\n\n$x^2$\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";
let pending = Promise.withResolvers<void>();
let validationPending = false;
let currentCard: Card = card;

export function finish() {
  pending.resolve();
}
export function fail() {
  pending.reject(new Error("Storage unavailable"));
}
export function setLanguage(language: "en" | "ja") {
  updatePreferences({ language });
}
export function receiveExternal() {
  replaceRemoteCards([{ ...currentCard, frontText: "Remote front", backText: "Remote back" }, candidate]);
}
export function readData() {
  return { cards: getCards(), decks: getDecks(), study: localStorage.getItem("tango-study") };
}

function UnknownErrorPage() {
  const value = useCard(card.id)!;
  const model = useCardEditPageModel(value);
  useEffect(() => {
    model.form.setError("frontText", { type: "unknown", message: "private diagnostic" });
  }, [model.form]);
  return (
    <AppLayout showHeader>
      {model.navigationGuard}
      <CardEditor {...model} preview={<BackText {...model.preview} />} />
    </AppLayout>
  );
}

function ControlledCreator() {
  const form = useForm<CardFormFields>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(
      cardContentInputSchema.superRefine(async () => {
        if (validationPending) await pending.promise;
      })
    ),
  });
  const preview = useCardPreviewContent(form.control, "raw", false);
  return (
    <CardCreator
      {...useCardTagForm(form)}
      availableTags={CATEGORY}
      preview={<BackText {...preview} />}
      deckName={deck.name}
      form={form}
      onCancel={() => undefined}
      onSubmit={form.handleSubmit(async (values) => {
        await submit({ deckId: deck.id, values });
      })}
    />
  );
}

function cardsForScenario(variant: string, value: Card, foreignDeckId: string) {
  if (variant === "create-mobile")
    return [
      { ...candidate, tags: ["chapter-1"] },
      createCard({
        id: "form-other-card",
        uid,
        deckId: foreignDeckId,
        frontText: "Other prompt",
        backText: "Other answer",
        tags: ["python"],
        createdAt: now,
        updatedAt: now,
      }),
    ];
  return variant.startsWith("create") ? [] : [value, candidate];
}

export default function scenario(params: URLSearchParams) {
  const variant = params.get("variant") ?? "edit";
  const values: Record<string, Partial<Card>> = {
    "japanese-error": { frontText: "" },
    localized: { frontText: "", backText: "未保存の回答" },
    "front-error": { frontText: "" },
    "back-error": { backText: "" },
    incomplete: { frontText: "", backText: "First\nSecond", tags: ["raw"] },
    "tag-validation": { tags: ["shared", "kept"] },
    preview: { backText: mathDraft, tags: [] },
    "preview-tags": { backText: "**Draft**", tags: ["python"] },
    external: { frontText: "Front text", backText: "Back text" },
    "edit-retry": { frontText: "Front text", backText: "Back text" },
    long: {
      backText: Array.from(
        { length: 150 },
        (_, index) => `Paragraph ${index + 1}: a long answer with meaningful content.`
      ).join("\n\n"),
      tags: ["raw"],
    },
  };
  let value: Card = { ...card, ...values[variant] };
  let selectedDeck = { ...deck };
  if (variant === "code") {
    selectedDeck = { ...selectedDeck, category: params.get("category") ?? "math" };
    value = { ...value, backText: "const answer = 42;", tags: JSON.parse(params.get("tags") ?? "[]") as string[] };
  }
  if (variant === "create-preview") selectedDeck = { ...selectedDeck, category: "raw" };
  currentCard = value;
  const creating = variant.startsWith("create");
  const mobile = variant === "create-mobile";
  const foreignDeck = createDeck({ id: "form-other-deck", uid, name: "Other deck", createdAt: now, updatedAt: now });
  prepareApp({
    decks: mobile ? [selectedDeck, foreignDeck] : [selectedDeck],
    cards: cardsForScenario(variant, value, foreignDeck.id),
    auth: { status: "authenticated", uid, isAnonymous: !mobile, displayName: mobile ? "Linked user" : null },
    preferences: {
      loadSample: false,
      language: variant.startsWith("system-") ? "system" : variant === "japanese-error" ? "ja" : "en",
      appearance: { darkMode: params.get("dark") === "true" },
    },
  });
  let attempts = 0;
  pending = Promise.withResolvers<void>();
  validationPending = variant === "create-validation";
  const create = io.createCard;
  const edit = io.editCard;
  io.createCard = async (owner, input) => {
    attempts += 1;
    if (variant === "create-retry" && attempts === 1) throw new Error("Storage unavailable");
    if (
      ["create-pending", "create-persistence", "create-immediate", "create-mobile"].includes(variant) ||
      (variant === "create-pending-retry" && attempts === 1)
    )
      await pending.promise;
    await create(owner, input);
  };
  io.editCard = async (owner, input) => {
    attempts += 1;
    if (variant === "edit-retry" && attempts === 1) throw new Error("Unavailable");
    if (variant === "edit-pending") await pending.promise;
    await edit(owner, input);
  };
  if (["unknown-error", "system-unknown"].includes(variant))
    return renderRoutes("/", [{ path: "/", element: <UnknownErrorPage /> }]);
  if (["create-immediate", "create-validation", "create-persistence"].includes(variant))
    return renderRoutes("/", [{ path: "/", element: <ControlledCreator /> }]);
  return renderRoutes(creating ? `/deck/${deck.id}/card/new` : `/card/${value.id}/edit`);
}

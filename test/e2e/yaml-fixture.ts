import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";

import { parseDocument } from "yaml";
import { z } from "zod";

export type FixtureCategory = "read" | "write" | "batch";
export type FixtureAuthProvider = "anonymous" | "google";

export interface FixtureNamespace {
  uid: string;
  id: (label: string) => string;
}

export interface FixtureUser {
  uid: string;
  provider: FixtureAuthProvider;
}

export interface FixtureDeck {
  id: string;
  name: string;
  url?: string;
  isPublic: boolean;
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  category: string;
  convertToBr: boolean;
  createdAt: number;
  updatedAt: number;
  localMode: boolean;
  uid?: string;
  deletedAt?: number | null;
}

export interface FixtureCard {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  tags: string[];
  uniqueKey: string;
  score: number;
  numberOfSeen: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  uid?: string;
  url?: string;
  startLine?: number;
  endLine?: number;
  lastSeenAt?: number;
  nextSeeingAt?: Date;
  interval?: number;
}

export interface FixtureStudySession {
  sessionId: string;
  deckId: string;
  cardOrderIds: string[];
  currentIndex: number;
  lastStudiedAt: number;
}

export interface FixturePreferences {
  language: "system" | "en" | "ja";
  loadSample: boolean;
  appearance: {
    darkMode: boolean;
    fullscreen: boolean;
    sizeBackText: number;
    hideBodyWhenCardChanged: boolean;
    showSwipeFeedback: boolean;
  };
  study: {
    maxNumberOfCardsToLearn: number;
    shuffled: boolean;
    useCardInterval: boolean;
    cardInterval: number;
    keepBackTextViewed: boolean;
    defaultAutoPlay: boolean;
    selectedTags: string[];
  };
  controls: {
    showSwipeButtonList: boolean;
    showPlaybackControls: boolean;
    showCardDetails: boolean;
    showScoreSlider: boolean;
    cardSwipeUp: SwipeAction;
    cardSwipeDown: SwipeAction;
    cardSwipeLeft: SwipeAction;
    cardSwipeRight: SwipeAction;
  };
}

export interface FixtureState {
  auth: { users: FixtureUser[] };
  remote: { decks: FixtureDeck[]; cards: FixtureCard[] };
  browser: {
    preferences: FixturePreferences;
    localDecks: FixtureDeck[];
    localCards: FixtureCard[];
    studySessions: Record<string, FixtureStudySession>;
  };
}

export interface FixtureSource {
  caseId: string;
  category: FixtureCategory;
  path: string;
  document: FixtureDocument;
}

export interface NamespacedFixture {
  state: FixtureState;
  users: ReadonlyMap<string, FixtureUser>;
  decks: ReadonlyMap<string, FixtureDeck>;
  cards: ReadonlyMap<string, FixtureCard>;
  sessions: ReadonlyMap<string, FixtureStudySession>;
  uid: (logicalUid: string) => string;
  id: (logicalId: string) => string;
}

const caseIdFromTestTitle = (title: string) => /^([A-Z]+-[0-9]{2}) /u.exec(title)?.[1];

export const requireE2ECaseId = (title: string): string => {
  const caseId = caseIdFromTestTitle(title);
  if (caseId === undefined) throw new Error(`E2E test title must start with a documented case ID: ${title}`);
  return caseId;
};

export const normalizeFixtureIdSegment = (label: string) => label.replaceAll(/[^a-zA-Z0-9-]/g, "-").toLowerCase();

const looksLikeRepositoryRoot = (candidate: string) =>
  existsSync(path.join(candidate, "package.json")) && existsSync(path.join(candidate, "docs/e2e/fixture"));

const findRepositoryRoot = (start: string): string => {
  let candidate = path.resolve(start);
  while (!looksLikeRepositoryRoot(candidate)) {
    const parent = path.dirname(candidate);
    if (parent === candidate) throw new Error(`Could not locate the repository root from ${start}`);
    candidate = parent;
  }
  return candidate;
};

// Playwright transpiles this module as CommonJS, so resolve from its stable launch directory instead of module globals.
const repositoryRoot = findRepositoryRoot(process.cwd());
const docsRoot = path.join(repositoryRoot, "docs/e2e");
const fixtureRoot = path.join(docsRoot, "fixture");
const sampleCardsPath = path.join(repositoryRoot, "sample/build/output.json");

const nonEmptyString = z.string().min(1);
const nonBlankString = z
  .string()
  .refine((value) => value.trim().length > 0, { message: "Expected a non-blank string" });
const optionalDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Expected an ISO-compatible date string" })
  .optional();

const userSchema = z.strictObject({
  uid: nonEmptyString,
  provider: z.enum(["anonymous", "google"]),
});

const remoteDeckSchema = z.strictObject({
  id: nonEmptyString,
  uid: nonEmptyString,
  localMode: z.literal(false).optional(),
  name: nonBlankString,
  url: z.url().optional(),
  isPublic: z.boolean().optional(),
  scoreMax: z.number().nullable().optional(),
  scoreMin: z.number().nullable().optional(),
  selectedTags: z.array(z.string()).optional(),
  tagAndFilter: z.boolean().optional(),
  category: z.string().optional(),
  convertToBr: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().nullable().optional(),
});

const localDeckSchema = z.strictObject({
  id: nonEmptyString,
  localMode: z.literal(true),
  name: nonBlankString,
  url: z.url().optional(),
  isPublic: z.boolean().optional(),
  scoreMax: z.number().nullable().optional(),
  scoreMin: z.number().nullable().optional(),
  selectedTags: z.array(z.string()).optional(),
  tagAndFilter: z.boolean().optional(),
  category: z.string().optional(),
  convertToBr: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

const cardContentFields = {
  frontText: nonBlankString,
  backText: nonBlankString,
  tags: z.array(z.string()).optional(),
  uniqueKey: nonBlankString,
  url: z.string().optional(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
} as const;

const cardStateFields = {
  score: z.number().optional(),
  numberOfSeen: z.number().nonnegative().optional(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: optionalDateString,
  interval: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().nullable().optional(),
} as const;

const remoteCardSchema = z.strictObject({
  id: nonEmptyString,
  deckId: nonEmptyString,
  uid: nonEmptyString,
  ...cardContentFields,
  ...cardStateFields,
});

const localCardSchema = z.strictObject({
  id: nonEmptyString,
  deckId: nonEmptyString,
  ...cardContentFields,
  ...cardStateFields,
});

const swipeActionSchema = z.enum([
  "DoNothing",
  "GoBack",
  "GoToPrevCard",
  "GoToNextCard",
  "GoToNextCardMastered",
  "GoToNextCardNotMastered",
  "GoToNextCardToggleMastered",
]);
type SwipeAction = z.infer<typeof swipeActionSchema>;

const preferencesSchema = z.strictObject({
  language: z.enum(["system", "en", "ja"]).optional(),
  loadSample: z.boolean().optional(),
  appearance: z
    .strictObject({
      darkMode: z.boolean().optional(),
      fullscreen: z.boolean().optional(),
      sizeBackText: z.number().min(0).optional(),
      hideBodyWhenCardChanged: z.boolean().optional(),
      showSwipeFeedback: z.boolean().optional(),
    })
    .optional(),
  study: z
    .strictObject({
      maxNumberOfCardsToLearn: z.number().int().min(0).max(100).optional(),
      shuffled: z.boolean().optional(),
      useCardInterval: z.boolean().optional(),
      cardInterval: z.number().min(0).max(60).optional(),
      keepBackTextViewed: z.boolean().optional(),
      defaultAutoPlay: z.boolean().optional(),
      selectedTags: z.array(z.string()).optional(),
    })
    .optional(),
  controls: z
    .strictObject({
      showSwipeButtonList: z.boolean().optional(),
      showPlaybackControls: z.boolean().optional(),
      showCardDetails: z.boolean().optional(),
      showScoreSlider: z.boolean().optional(),
      cardSwipeUp: swipeActionSchema.optional(),
      cardSwipeDown: swipeActionSchema.optional(),
      cardSwipeLeft: swipeActionSchema.optional(),
      cardSwipeRight: swipeActionSchema.optional(),
    })
    .optional(),
});

const studySessionSchema = z.strictObject({
  sessionId: nonEmptyString,
  deckId: nonEmptyString,
  cardOrderIds: z.array(nonEmptyString).min(1),
  currentIndex: z.number().int().nonnegative(),
  lastStudiedAt: z.number().nonnegative().optional(),
});

const sampleDeckSchema = z.strictObject({
  deck: localDeckSchema,
  cards: z.strictObject({
    source: nonEmptyString,
    idTemplate: nonEmptyString,
    deckId: nonEmptyString,
  }),
});

const fixtureDocumentSchema = z.strictObject({
  auth: z.strictObject({ users: z.array(userSchema).min(1) }),
  remote: z
    .strictObject({
      decks: z.array(remoteDeckSchema).optional(),
      cards: z.array(remoteCardSchema).optional(),
    })
    .optional(),
  browser: z
    .strictObject({
      preferences: preferencesSchema.optional(),
      localDecks: z.array(localDeckSchema).optional(),
      localCards: z.array(localCardSchema).optional(),
      studySessions: z.record(nonEmptyString, studySessionSchema).optional(),
      sampleDeck: sampleDeckSchema.optional(),
    })
    .optional(),
});

type FixtureDocument = z.infer<typeof fixtureDocumentSchema>;
type RawRemoteDeck = z.infer<typeof remoteDeckSchema>;
type RawLocalDeck = z.infer<typeof localDeckSchema>;
type RawRemoteCard = z.infer<typeof remoteCardSchema>;
type RawLocalCard = z.infer<typeof localCardSchema>;
type RawPreferences = z.infer<typeof preferencesSchema>;
type RawUser = z.infer<typeof userSchema>;
type RawStudySession = z.infer<typeof studySessionSchema>;
type RawSampleDeck = NonNullable<NonNullable<FixtureDocument["browser"]>["sampleDeck"]>;

const sampleCardSchema = z.strictObject(cardContentFields);
type RawSampleCard = z.infer<typeof sampleCardSchema>;

const formatIssues = (error: z.ZodError) =>
  error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`).join("; ");

const isWithin = (candidate: string, parent: string) => {
  const relative = path.relative(parent, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
};

type PlainObject = Record<string, unknown>;

const dangerousObjectKeys = new Set(["__proto__", "constructor", "prototype"]);
// Cycle detection alone does not bound recursive I/O for a valid but unexpectedly long inheritance chain.
const maxFixtureInheritanceDepth = 8;
const materializedFixtureCache = new Map<string, MaterializedFixture>();
const realFixtureRoot = realpathSync(fixtureRoot);

interface MaterializedFixture {
  document: FixtureDocument;
  // Retaining the full chain lets cached parents participate in cycle and depth checks for a new leaf.
  inheritanceChain: readonly string[];
}

const displayFixtureChain = (fixturePaths: readonly string[]) =>
  fixturePaths.map((fixturePath) => path.relative(repositoryRoot, fixturePath)).join(" -> ");

const isPlainObject = (value: unknown): value is PlainObject => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const assertSafeFixtureValue = (value: unknown, fixturePath: string, objectPath: readonly string[] = []): void => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertSafeFixtureValue(item, fixturePath, [...objectPath, String(index)]);
    });
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (!isPlainObject(value)) {
    throw new Error(
      `Invalid YAML fixture ${path.relative(repositoryRoot, fixturePath)}: ${objectPath.join(".") || "<root>"} must be a plain object`
    );
  }
  for (const key of Object.getOwnPropertyNames(value)) {
    if (dangerousObjectKeys.has(key)) {
      throw new Error(
        `Invalid YAML fixture ${path.relative(repositoryRoot, fixturePath)}: unsafe object key ${[...objectPath, key].join(".")}`
      );
    }
    assertSafeFixtureValue(value[key], fixturePath, [...objectPath, key]);
  }
};

const parseYamlValue = (fixturePath: string): unknown => {
  const document = parseDocument(readFileSync(fixturePath, "utf8"), { strict: true, uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(
      `Invalid YAML fixture ${path.relative(repositoryRoot, fixturePath)}: ${document.errors
        .map(({ message }) => message)
        .join("; ")}`
    );
  }

  let value: unknown;
  try {
    // Fixture YAML has no reason to use aliases. Rejecting them also bounds expansion before validation.
    value = document.toJS({ maxAliasCount: 0 });
  } catch (error) {
    throw new Error(`Invalid YAML fixture ${path.relative(repositoryRoot, fixturePath)}: ${String(error)}`, {
      cause: error,
    });
  }

  // Merge only data objects with inert prototypes and keys; this must remain true even if YAML parsing changes.
  assertSafeFixtureValue(value, fixturePath);
  return value;
};

const isBareYamlFilename = (value: string) =>
  value.length > ".yaml".length &&
  value.endsWith(".yaml") &&
  path.posix.basename(value) === value &&
  path.win32.basename(value) === value;

const withoutExtends = (value: PlainObject): PlainObject =>
  Object.fromEntries(Object.entries(value).filter(([key]) => key !== "extends"));

const mergeFixtureObjects = (parent: PlainObject, child: PlainObject): PlainObject => {
  const merged: PlainObject = { ...parent };
  for (const [key, childValue] of Object.entries(child)) {
    const parentValue = parent[key];
    // Arrays and scalars are atomic fixture declarations; only two objects recursively inherit fields.
    merged[key] =
      isPlainObject(parentValue) && isPlainObject(childValue)
        ? mergeFixtureObjects(parentValue, childValue)
        : childValue;
  }
  return merged;
};

const resolveParentFixturePath = (parentName: string, childPath: string): string => {
  if (!isBareYamlFilename(parentName)) {
    throw new Error(
      `Invalid YAML fixture ${path.relative(repositoryRoot, childPath)}: extends must be a bare .yaml filename`
    );
  }
  const candidate = path.resolve(fixtureRoot, parentName);
  if (path.dirname(candidate) !== fixtureRoot || !existsSync(candidate)) {
    throw new Error(
      `Invalid YAML fixture ${path.relative(repositoryRoot, childPath)}: parent fixture does not exist: ${parentName}`
    );
  }
  const realParentPath = realpathSync(candidate);
  // A bare filename is not sufficient when the directory entry itself is a symlink outside the fixture root.
  if (!isWithin(realParentPath, realFixtureRoot)) {
    throw new Error(
      `Invalid YAML fixture ${path.relative(repositoryRoot, childPath)}: parent fixture resolves outside docs/e2e/fixture`
    );
  }
  return realParentPath;
};

const assertInheritanceDepth = (depth: number, chain: readonly string[]) => {
  if (depth <= maxFixtureInheritanceDepth) return;
  throw new Error(
    `Fixture inheritance exceeds maximum depth ${String(maxFixtureInheritanceDepth)}: ${displayFixtureChain(chain)}`
  );
};

const materializeFixture = (fixturePath: string, ancestors: readonly string[] = []): MaterializedFixture => {
  const realFixturePath = realpathSync(fixturePath);
  if (!isWithin(realFixturePath, realFixtureRoot)) {
    throw new Error(`Fixture resolves outside docs/e2e/fixture: ${path.relative(repositoryRoot, fixturePath)}`);
  }
  if (ancestors.includes(realFixturePath)) {
    throw new Error(`Fixture inheritance cycle: ${displayFixtureChain([...ancestors, realFixturePath])}`);
  }
  assertInheritanceDepth(ancestors.length, [...ancestors, realFixturePath]);

  const cached = materializedFixtureCache.get(realFixturePath);
  if (cached !== undefined) {
    const cachedAncestor = cached.inheritanceChain.find((candidate) => ancestors.includes(candidate));
    if (cachedAncestor !== undefined) {
      throw new Error(`Fixture inheritance cycle: ${displayFixtureChain([...ancestors, ...cached.inheritanceChain])}`);
    }
    assertInheritanceDepth(ancestors.length + cached.inheritanceChain.length - 1, [
      ...ancestors,
      ...cached.inheritanceChain,
    ]);
    return cached;
  }

  const rawValue = parseYamlValue(realFixturePath);
  let materializedValue: unknown = rawValue;
  let inheritanceChain: readonly string[] = [realFixturePath];

  if (isPlainObject(rawValue) && Object.hasOwn(rawValue, "extends")) {
    const parentName = rawValue.extends;
    if (typeof parentName !== "string") {
      throw new Error(
        `Invalid YAML fixture ${path.relative(repositoryRoot, realFixturePath)}: extends must be a bare .yaml filename`
      );
    }
    const parentPath = resolveParentFixturePath(parentName, realFixturePath);
    const parent = materializeFixture(parentPath, [...ancestors, realFixturePath]);
    materializedValue = mergeFixtureObjects(parent.document, withoutExtends(rawValue));
    inheritanceChain = [realFixturePath, ...parent.inheritanceChain];
  }

  const parsed = fixtureDocumentSchema.safeParse(materializedValue);
  if (!parsed.success) {
    throw new Error(
      `Invalid YAML fixture ${path.relative(repositoryRoot, realFixturePath)}: ${formatIssues(parsed.error)}`
    );
  }
  const materialized = { document: parsed.data, inheritanceChain };
  materializedFixtureCache.set(realFixturePath, materialized);
  return materialized;
};

interface FixtureIndexEntry {
  category: FixtureCategory;
  path: string;
}

interface DocumentedCase {
  caseId: string;
  markdownPath: string;
  section: string;
}

let fixtureIndex: ReadonlyMap<string, FixtureIndexEntry> | undefined;

const requireSingle = <Value>(values: readonly Value[], message: string): Value => {
  if (values.length !== 1) throw new Error(`${message}; found ${String(values.length)}`);
  const [value] = values;
  if (value === undefined) throw new Error(message);
  return value;
};

const requiredCapture = (match: RegExpMatchArray): string => {
  const [, value] = match;
  if (value === undefined) throw new Error(`Regular expression did not capture a required value: ${match[0]}`);
  return value;
};

const readDocumentedCases = (markdownPath: string): DocumentedCase[] => {
  const markdown = readFileSync(markdownPath, "utf8");
  const headings = [...markdown.matchAll(/^### ([A-Z]+-[0-9]{2})\b.*$/gmu)];
  return headings.map((heading, indexInFile) => {
    const [, caseId] = heading;
    if (caseId === undefined || heading.index === undefined) {
      throw new Error(`Could not parse an E2E case heading in ${path.relative(repositoryRoot, markdownPath)}`);
    }
    const nextHeading = headings[indexInFile + 1];
    return {
      caseId,
      markdownPath,
      section: markdown.slice(heading.index, nextHeading?.index ?? markdown.length),
    };
  });
};

const resolveFixturePath = (documentedCase: DocumentedCase, fixtureLink: string) => {
  const { caseId, markdownPath } = documentedCase;
  const resolvedPath = path.resolve(path.dirname(markdownPath), fixtureLink);
  if (path.dirname(resolvedPath) !== fixtureRoot) {
    throw new Error(`${caseId} Fixture must be a direct child of docs/e2e/fixture`);
  }
  if (!existsSync(resolvedPath)) {
    throw new Error(`${caseId} Fixture does not exist: ${path.relative(repositoryRoot, resolvedPath)}`);
  }
  const realPath = realpathSync(resolvedPath);
  if (!isWithin(realPath, realFixtureRoot)) {
    throw new Error(`${caseId} Fixture resolves outside docs/e2e/fixture`);
  }
  return realPath;
};

const readFixtureIndexEntry = (documentedCase: DocumentedCase): FixtureIndexEntry => {
  const { caseId, section } = documentedCase;
  const categories = [...section.matchAll(/^カテゴリ: `(read|write|batch)`$/gmu)].map(requiredCapture);
  const category = requireSingle(categories, `${caseId} must declare exactly one E2E category`) as FixtureCategory;
  const fixtureLinks = [...section.matchAll(/^- Fixture: \[[^\]]+\]\(([^)]+)\)$/gmu)].map(requiredCapture);
  const fixtureLink = requireSingle(fixtureLinks, `${caseId} must declare exactly one Fixture link`);
  if (!fixtureLink.endsWith(".yaml")) throw new Error(`${caseId} Fixture link must reference a YAML file`);
  return { category, path: resolveFixturePath(documentedCase, fixtureLink) };
};

const listE2eMarkdownFiles = () =>
  readdirSync(docsRoot)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(docsRoot, file));

const buildFixtureIndex = (): ReadonlyMap<string, FixtureIndexEntry> => {
  const index = new Map<string, FixtureIndexEntry>();
  for (const markdownPath of listE2eMarkdownFiles()) {
    for (const documentedCase of readDocumentedCases(markdownPath)) {
      if (index.has(documentedCase.caseId)) {
        throw new Error(`Duplicate documented E2E case ID: ${documentedCase.caseId}`);
      }
      index.set(documentedCase.caseId, readFixtureIndexEntry(documentedCase));
    }
  }
  return index;
};

export const loadFixtureSource = (caseId: string): FixtureSource => {
  fixtureIndex ??= buildFixtureIndex();
  const entry = fixtureIndex.get(caseId);
  if (entry === undefined) throw new Error(`No documented YAML fixture found for E2E case ${caseId}`);
  return {
    caseId,
    category: entry.category,
    path: path.relative(repositoryRoot, entry.path),
    document: materializeFixture(entry.path).document,
  };
};

const fixturePreferenceDefaults: FixturePreferences = {
  // The product defaults to system; E2E uses English so existing accessible-name assertions are host-independent.
  language: "en",
  loadSample: true,
  appearance: {
    darkMode: false,
    fullscreen: false,
    sizeBackText: 0,
    hideBodyWhenCardChanged: true,
    showSwipeFeedback: false,
  },
  study: {
    maxNumberOfCardsToLearn: 10,
    shuffled: false,
    useCardInterval: false,
    cardInterval: 60,
    keepBackTextViewed: false,
    defaultAutoPlay: false,
    selectedTags: [],
  },
  controls: {
    showSwipeButtonList: true,
    showPlaybackControls: true,
    showCardDetails: true,
    showScoreSlider: false,
    cardSwipeUp: "GoToNextCardMastered",
    cardSwipeDown: "GoToNextCardNotMastered",
    cardSwipeLeft: "GoToPrevCard",
    cardSwipeRight: "GoToNextCard",
  },
};

type OptionalOverrides<Value> = { [Key in keyof Value]?: Value[Key] | undefined };

const withDefaults = <Value extends object>(
  defaults: Value,
  overrides: OptionalOverrides<Value> | undefined
): Value => ({ ...defaults, ...overrides });

const normalizePreferences = (raw: RawPreferences | undefined): FixturePreferences => {
  const appearance = withDefaults(fixturePreferenceDefaults.appearance, raw?.appearance);
  const study = withDefaults(fixturePreferenceDefaults.study, raw?.study);
  return {
    language: raw?.language ?? fixturePreferenceDefaults.language,
    loadSample: raw?.loadSample ?? fixturePreferenceDefaults.loadSample,
    appearance,
    study: { ...study, selectedTags: [...study.selectedTags] },
    controls: withDefaults(fixturePreferenceDefaults.controls, raw?.controls),
  };
};

const normalizeDeck = (raw: RawRemoteDeck | RawLocalDeck, id: string, uid?: string): FixtureDeck => {
  const normalized: FixtureDeck = {
    id,
    name: raw.name,
    ...(raw.url === undefined ? {} : { url: raw.url }),
    isPublic: raw.isPublic ?? false,
    scoreMax: raw.scoreMax ?? null,
    scoreMin: raw.scoreMin ?? null,
    selectedTags: [...(raw.selectedTags ?? [])],
    tagAndFilter: raw.tagAndFilter ?? false,
    category: raw.category ?? "",
    convertToBr: raw.convertToBr ?? false,
    createdAt: raw.createdAt ?? 0,
    updatedAt: raw.updatedAt ?? 0,
    localMode: uid === undefined,
  };
  if (uid === undefined) return normalized;
  const deletedAt = "deletedAt" in raw ? (raw.deletedAt ?? null) : null;
  return { ...normalized, uid, localMode: false, deletedAt };
};

const normalizeCard = (raw: RawRemoteCard | RawLocalCard, id: string, deckId: string, uid?: string): FixtureCard => {
  const normalized: FixtureCard = {
    id,
    deckId,
    frontText: raw.frontText,
    backText: raw.backText,
    tags: [...(raw.tags ?? [])],
    uniqueKey: raw.uniqueKey,
    score: raw.score ?? 0,
    numberOfSeen: raw.numberOfSeen ?? 0,
    createdAt: raw.createdAt ?? 0,
    updatedAt: raw.updatedAt ?? 0,
    deletedAt: raw.deletedAt ?? null,
    ...(raw.url === undefined ? {} : { url: raw.url }),
    ...(raw.startLine === undefined ? {} : { startLine: raw.startLine }),
    ...(raw.endLine === undefined ? {} : { endLine: raw.endLine }),
    ...(raw.lastSeenAt === undefined ? {} : { lastSeenAt: raw.lastSeenAt }),
    ...(raw.nextSeeingAt === undefined ? {} : { nextSeeingAt: new Date(raw.nextSeeingAt) }),
    ...(raw.interval === undefined ? {} : { interval: raw.interval }),
  };
  return uid === undefined ? normalized : { ...normalized, uid };
};

const assertUnique = (values: readonly string[], label: string) => {
  const duplicates = [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
  if (duplicates.length > 0) throw new Error(`Duplicate ${label}: ${duplicates.join(", ")}`);
};

const parseSampleCards = (sampleDeck: NonNullable<FixtureDocument["browser"]>["sampleDeck"]) => {
  if (sampleDeck === undefined) return [];
  const resolvedSource = path.resolve(repositoryRoot, sampleDeck.cards.source);
  if (resolvedSource !== sampleCardsPath) {
    throw new Error(`Sample Card source must be sample/build/output.json: ${sampleDeck.cards.source}`);
  }
  if (!existsSync(resolvedSource)) throw new Error("Sample Card source is missing; run the sample build first");
  const realRepositoryRoot = realpathSync(repositoryRoot);
  const realBuildRoot = realpathSync(path.dirname(sampleCardsPath));
  const approvedRealSource = path.join(realBuildRoot, path.basename(sampleCardsPath));
  if (!isWithin(realBuildRoot, realRepositoryRoot) || realpathSync(resolvedSource) !== approvedRealSource) {
    throw new Error("Sample Card source resolves outside the approved build output");
  }
  if (sampleDeck.deck.id !== "sample-v1" || sampleDeck.cards.deckId !== "sample-v1") {
    throw new Error("Sample Deck and Card source must use the application-defined sample-v1 ID");
  }
  if (sampleDeck.cards.idTemplate !== "sample-v1-card-{index}") {
    throw new Error("Sample Card IDs must use the application-defined sample-v1-card-{index} template");
  }

  let value: unknown;
  try {
    value = JSON.parse(readFileSync(resolvedSource, "utf8"));
  } catch (error) {
    throw new Error(`Invalid Sample Card JSON: ${String(error)}`, { cause: error });
  }
  const parsed = z.array(sampleCardSchema).safeParse(value);
  if (!parsed.success) throw new Error(`Invalid Sample Card JSON: ${formatIssues(parsed.error)}`);
  return parsed.data;
};

interface LogicalFixtureCollections {
  users: RawUser[];
  remoteDecks: RawRemoteDeck[];
  remoteCards: RawRemoteCard[];
  localDecks: RawLocalDeck[];
  localCards: RawLocalCard[];
  studySessions: Record<string, RawStudySession>;
  sampleDeck: RawSampleDeck | undefined;
  sampleCards: RawSampleCard[];
  sampleCardIds: string[];
}

const sampleCardId = (index: number) => `sample-v1-card-${String(index + 1)}`;

const isStableApplicationId = (logicalId: string) =>
  logicalId === "sample-v1" || /^sample-v1-card-[1-9][0-9]*$/u.test(logicalId);

const collectLogicalFixture = (document: FixtureDocument): LogicalFixtureCollections => {
  const {
    auth: { users },
  } = document;
  const remoteDecks = document.remote?.decks ?? [];
  const remoteCards = document.remote?.cards ?? [];
  const localDecks = document.browser?.localDecks ?? [];
  const localCards = document.browser?.localCards ?? [];
  const studySessions = document.browser?.studySessions ?? {};
  const sampleDeck = document.browser?.sampleDeck;
  const sampleCards = parseSampleCards(sampleDeck);
  return {
    users,
    remoteDecks,
    remoteCards,
    localDecks,
    localCards,
    studySessions,
    sampleDeck,
    sampleCards,
    sampleCardIds: sampleCards.map((_card, index) => sampleCardId(index)),
  };
};

const validateUniqueLogicalIds = (fixture: LogicalFixtureCollections) => {
  assertUnique(
    fixture.users.map(({ uid: logicalUid }) => logicalUid),
    "auth UID"
  );
  const sampleDecks = fixture.sampleDeck === undefined ? [] : [fixture.sampleDeck.deck];
  assertUnique(
    [...fixture.remoteDecks, ...fixture.localDecks, ...sampleDecks].map(({ id: logicalId }) => logicalId),
    "Deck ID"
  );
  const cardIds = [...fixture.remoteCards, ...fixture.localCards].map(({ id: logicalId }) => logicalId);
  assertUnique(cardIds.concat(fixture.sampleCardIds), "Card ID");
  assertUnique(
    Object.values(fixture.studySessions).map(({ sessionId }) => sessionId),
    "Study session ID"
  );
};

const validateStableApplicationIds = (fixture: LogicalFixtureCollections) => {
  const ordinaryIds = [
    ...fixture.remoteDecks.map(({ id }) => id),
    ...fixture.remoteCards.map(({ id }) => id),
    ...fixture.localDecks.map(({ id }) => id),
    ...fixture.localCards.map(({ id }) => id),
    ...Object.values(fixture.studySessions).map(({ sessionId }) => sessionId),
  ];
  const reservedId = ordinaryIds.find(isStableApplicationId);
  if (reservedId !== undefined) {
    throw new Error(
      `Application-defined stable ID ${reservedId} is reserved for browser.sampleDeck and its generated Cards`
    );
  }
};

const validateRemoteReferences = (fixture: LogicalFixtureCollections) => {
  const userIds = new Set(fixture.users.map(({ uid: logicalUid }) => logicalUid));
  const remoteDeckById = new Map(fixture.remoteDecks.map((deck) => [deck.id, deck]));
  for (const deck of fixture.remoteDecks) {
    if (!userIds.has(deck.uid)) throw new Error(`Remote Deck ${deck.id} references unknown UID ${deck.uid}`);
  }
  for (const card of fixture.remoteCards) {
    if (!userIds.has(card.uid)) throw new Error(`Remote Card ${card.id} references unknown UID ${card.uid}`);
    const deck = remoteDeckById.get(card.deckId);
    if (deck === undefined) throw new Error(`Remote Card ${card.id} references unknown remote Deck ${card.deckId}`);
    if (deck.uid !== card.uid) throw new Error(`Remote Card ${card.id} owner must match Deck ${card.deckId}`);
  }
};

const localDeckIds = (fixture: LogicalFixtureCollections) =>
  new Set([
    ...fixture.localDecks.map(({ id: logicalId }) => logicalId),
    ...(fixture.sampleDeck === undefined ? [] : [fixture.sampleDeck.deck.id]),
  ]);

const validateLocalReferences = (fixture: LogicalFixtureCollections) => {
  const deckIds = localDeckIds(fixture);
  for (const card of fixture.localCards) {
    if (!deckIds.has(card.deckId)) {
      throw new Error(`Local Card ${card.id} references unknown local Deck ${card.deckId}`);
    }
  }
};

interface SessionCardReference {
  id: string;
  deckId: string;
}

const buildCardLookup = (fixture: LogicalFixtureCollections) => {
  const cards: SessionCardReference[] = [
    ...fixture.remoteCards.map(({ id, deckId }) => ({ id, deckId })),
    ...fixture.localCards.map(({ id, deckId }) => ({ id, deckId })),
    ...fixture.sampleCardIds.map((id) => ({ id, deckId: "sample-v1" })),
  ];
  return new Map(cards.map((card) => [card.id, card]));
};

const validateSession = (
  key: string,
  session: RawStudySession,
  deckIds: ReadonlySet<string>,
  cardById: ReadonlyMap<string, SessionCardReference>
) => {
  if (key !== session.deckId) throw new Error(`Study session key ${key} must match deckId ${session.deckId}`);
  if (!deckIds.has(session.deckId)) {
    throw new Error(`Study session ${session.sessionId} references unknown Deck ${session.deckId}`);
  }
  if (session.currentIndex >= session.cardOrderIds.length) {
    throw new Error(`Study session ${session.sessionId} currentIndex must point to an active Card`);
  }
  assertUnique(session.cardOrderIds, `Card ID in Study session ${session.sessionId}`);
  for (const cardId of session.cardOrderIds) {
    const card = cardById.get(cardId);
    if (card === undefined) throw new Error(`Study session ${session.sessionId} references unknown Card ${cardId}`);
    if (card.deckId !== session.deckId) {
      throw new Error(`Study session ${session.sessionId} Card ${cardId} belongs to another Deck`);
    }
  }
};

const validateStudySessions = (fixture: LogicalFixtureCollections) => {
  const deckIds = new Set([...fixture.remoteDecks.map(({ id: logicalId }) => logicalId), ...localDeckIds(fixture)]);
  const cardById = buildCardLookup(fixture);
  for (const [key, session] of Object.entries(fixture.studySessions)) {
    validateSession(key, session, deckIds, cardById);
  }
};

const validateLogicalReferences = (document: FixtureDocument) => {
  const fixture = collectLogicalFixture(document);
  validateUniqueLogicalIds(fixture);
  validateStableApplicationIds(fixture);
  validateRemoteReferences(fixture);
  validateLocalReferences(fixture);
  validateStudySessions(fixture);
  return fixture;
};

interface FixtureIdentifierMappers {
  uidFor: (logicalUid: string) => string;
  idFor: (logicalId: string) => string;
}

const validateUserOverrides = (users: readonly RawUser[], userOverrides: Readonly<Record<string, string>>) => {
  const knownUsers = new Set(users.map(({ uid: logicalUid }) => logicalUid));
  for (const [logicalUid, runtimeUid] of Object.entries(userOverrides)) {
    if (!knownUsers.has(logicalUid)) throw new Error(`Cannot remap unknown fixture UID ${logicalUid}`);
    if (runtimeUid.trim() === "") throw new Error(`Runtime UID for ${logicalUid} must not be empty`);
  }
};

const createIdentifierMappers = (
  namespace: FixtureNamespace,
  userOverrides: Readonly<Record<string, string>>
): FixtureIdentifierMappers => {
  const defaultUid = (logicalUid: string) =>
    logicalUid === "user-1" ? namespace.uid : namespace.id(`uid-${logicalUid}`);
  const uidFor = (logicalUid: string) => userOverrides[logicalUid] ?? defaultUid(logicalUid);
  const idFor = (logicalId: string) => (isStableApplicationId(logicalId) ? logicalId : namespace.id(logicalId));
  return { uidFor, idFor };
};

interface NormalizedCollection<Value> {
  values: Value[];
  lookup: Map<string, Value>;
}

const buildNormalizedCollection = <Input, Value>(
  items: readonly Input[],
  normalize: (item: Input, index: number) => readonly [string, Value]
): NormalizedCollection<Value> => {
  const entries = items.map(normalize);
  return {
    values: entries.map(([, value]) => value),
    lookup: new Map(entries),
  };
};

const mergeNormalizedCollections = <Value>(
  ...collections: readonly NormalizedCollection<Value>[]
): NormalizedCollection<Value> => ({
  values: collections.flatMap(({ values }) => values),
  lookup: new Map(collections.flatMap(({ lookup }) => [...lookup.entries()])),
});

const normalizeUsers = (
  users: readonly RawUser[],
  uidFor: FixtureIdentifierMappers["uidFor"]
): NormalizedCollection<FixtureUser> =>
  buildNormalizedCollection(users, (user) => [user.uid, { ...user, uid: uidFor(user.uid) }]);

const normalizeRemoteDecks = (
  decks: readonly RawRemoteDeck[],
  identifiers: FixtureIdentifierMappers
): NormalizedCollection<FixtureDeck> =>
  buildNormalizedCollection(decks, (deck) => [
    deck.id,
    normalizeDeck(deck, identifiers.idFor(deck.id), identifiers.uidFor(deck.uid)),
  ]);

const normalizeLocalDecks = (
  decks: readonly RawLocalDeck[],
  idFor: FixtureIdentifierMappers["idFor"]
): NormalizedCollection<FixtureDeck> =>
  buildNormalizedCollection(decks, (deck) => [deck.id, normalizeDeck(deck, idFor(deck.id))]);

const normalizeRemoteCards = (
  cards: readonly RawRemoteCard[],
  identifiers: FixtureIdentifierMappers
): NormalizedCollection<FixtureCard> =>
  buildNormalizedCollection(cards, (card) => [
    card.id,
    normalizeCard(card, identifiers.idFor(card.id), identifiers.idFor(card.deckId), identifiers.uidFor(card.uid)),
  ]);

const normalizeLocalCards = (
  cards: readonly RawLocalCard[],
  idFor: FixtureIdentifierMappers["idFor"]
): NormalizedCollection<FixtureCard> =>
  buildNormalizedCollection(cards, (card) => [card.id, normalizeCard(card, idFor(card.id), idFor(card.deckId))]);

const normalizeSampleDeck = (
  sampleDeck: RawSampleDeck | undefined,
  idFor: FixtureIdentifierMappers["idFor"]
): NormalizedCollection<FixtureDeck> => {
  const decks = sampleDeck === undefined ? [] : [sampleDeck.deck];
  return normalizeLocalDecks(decks, idFor);
};

const normalizeSampleCards = (
  sampleDeck: RawSampleDeck | undefined,
  cards: readonly RawSampleCard[],
  idFor: FixtureIdentifierMappers["idFor"]
): NormalizedCollection<FixtureCard> => {
  if (sampleDeck === undefined) return { values: [], lookup: new Map() };
  return buildNormalizedCollection(cards, (card, index) => {
    const logicalId = sampleDeck.cards.idTemplate.replace("{index}", String(index + 1));
    const logicalDeckId = sampleDeck.cards.deckId;
    return [
      logicalId,
      normalizeCard({ ...card, id: logicalId, deckId: logicalDeckId }, idFor(logicalId), idFor(logicalDeckId)),
    ];
  });
};

interface NormalizedSessions {
  byDeckId: Record<string, FixtureStudySession>;
  lookup: Map<string, FixtureStudySession>;
}

const normalizeSessions = (
  sessions: Readonly<Record<string, RawStudySession>>,
  idFor: FixtureIdentifierMappers["idFor"]
): NormalizedSessions => {
  const entries = Object.entries(sessions).map(([logicalDeckId, rawSession]) => {
    const session: FixtureStudySession = {
      sessionId: idFor(rawSession.sessionId),
      deckId: idFor(rawSession.deckId),
      cardOrderIds: rawSession.cardOrderIds.map(idFor),
      currentIndex: rawSession.currentIndex,
      lastStudiedAt: rawSession.lastStudiedAt ?? 0,
    };
    return { logicalDeckId, runtimeDeckId: idFor(logicalDeckId), session };
  });
  return {
    byDeckId: Object.fromEntries(entries.map(({ runtimeDeckId, session }) => [runtimeDeckId, session])),
    lookup: new Map(entries.map(({ logicalDeckId, session }) => [logicalDeckId, session])),
  };
};

const validateRuntimeIds = (
  users: NormalizedCollection<FixtureUser>,
  decks: NormalizedCollection<FixtureDeck>,
  cards: NormalizedCollection<FixtureCard>,
  sessions: NormalizedSessions
) => {
  assertUnique(
    users.values.map(({ uid: runtimeUid }) => runtimeUid),
    "runtime auth UID"
  );
  assertUnique(
    decks.values.map(({ id: runtimeId }) => runtimeId),
    "runtime Deck ID"
  );
  assertUnique(
    cards.values.map(({ id: runtimeId }) => runtimeId),
    "runtime Card ID"
  );
  assertUnique(
    [...sessions.lookup.values()].map(({ sessionId: runtimeId }) => runtimeId),
    "runtime Study session ID"
  );
};

export const namespaceFixture = (
  source: FixtureSource,
  namespace: FixtureNamespace,
  userOverrides: Readonly<Record<string, string>> = {}
): NamespacedFixture => {
  const { document } = source;
  const logical = validateLogicalReferences(document);
  validateUserOverrides(logical.users, userOverrides);
  const identifiers = createIdentifierMappers(namespace, userOverrides);
  const users = normalizeUsers(logical.users, identifiers.uidFor);
  const decks = mergeNormalizedCollections(
    normalizeRemoteDecks(logical.remoteDecks, identifiers),
    normalizeLocalDecks(logical.localDecks, identifiers.idFor),
    normalizeSampleDeck(logical.sampleDeck, identifiers.idFor)
  );
  const cards = mergeNormalizedCollections(
    normalizeRemoteCards(logical.remoteCards, identifiers),
    normalizeLocalCards(logical.localCards, identifiers.idFor),
    normalizeSampleCards(logical.sampleDeck, logical.sampleCards, identifiers.idFor)
  );
  const sessions = normalizeSessions(logical.studySessions, identifiers.idFor);
  validateRuntimeIds(users, decks, cards, sessions);

  const remoteDeckCount = logical.remoteDecks.length;
  const remoteCardCount = logical.remoteCards.length;

  return {
    state: {
      auth: { users: users.values },
      remote: {
        decks: decks.values.slice(0, remoteDeckCount),
        cards: cards.values.slice(0, remoteCardCount),
      },
      browser: {
        preferences: normalizePreferences(document.browser?.preferences),
        localDecks: decks.values.slice(remoteDeckCount),
        localCards: cards.values.slice(remoteCardCount),
        studySessions: sessions.byDeckId,
      },
    },
    users: users.lookup,
    decks: decks.lookup,
    cards: cards.lookup,
    sessions: sessions.lookup,
    uid: identifiers.uidFor,
    id: identifiers.idFor,
  };
};

const contractNamespace = (caseId: string): FixtureNamespace => {
  const stem = `contract-${caseId.toLowerCase()}`;
  return {
    uid: `${stem}-user`,
    // Mirror the lossy runtime mapping so preflight validation also catches IDs that collide after normalization.
    id: (label) => `${stem}-${normalizeFixtureIdSegment(label)}`,
  };
};

export const validateE2EContract = (testTitles: readonly string[]) => {
  fixtureIndex ??= buildFixtureIndex();
  const documentedCaseIds = [...fixtureIndex.keys()].sort((left, right) => left.localeCompare(right));

  // Validate every documented source before any browser or emulator setup can create persistent state.
  for (const caseId of documentedCaseIds) {
    namespaceFixture(loadFixtureSource(caseId), contractNamespace(caseId));
  }

  const titlesWithoutCaseId: string[] = [];
  const testCounts = new Map<string, number>();
  for (const title of testTitles) {
    const caseId = caseIdFromTestTitle(title);
    if (caseId === undefined) {
      titlesWithoutCaseId.push(title);
    } else {
      testCounts.set(caseId, (testCounts.get(caseId) ?? 0) + 1);
    }
  }

  const documentedCaseIdSet = new Set(documentedCaseIds);
  const missing = documentedCaseIds.filter((caseId) => !testCounts.has(caseId));
  const duplicates = [...testCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([caseId, count]) => `${caseId} (${String(count)})`)
    .sort((left, right) => left.localeCompare(right));
  const undocumented = [...testCounts.keys()]
    .filter((caseId) => !documentedCaseIdSet.has(caseId))
    .sort((left, right) => left.localeCompare(right));
  const problems = [
    ...(titlesWithoutCaseId.length === 0
      ? []
      : [`test titles without a case ID: ${titlesWithoutCaseId.map((title) => JSON.stringify(title)).join(", ")}`]),
    ...(missing.length === 0 ? [] : [`missing Playwright tests: ${missing.join(", ")}`]),
    ...(duplicates.length === 0 ? [] : [`duplicate Playwright case IDs: ${duplicates.join(", ")}`]),
    ...(undocumented.length === 0 ? [] : [`undocumented Playwright case IDs: ${undocumented.join(", ")}`]),
  ];
  if (problems.length > 0) throw new Error(`Invalid E2E contract: ${problems.join("; ")}`);
};

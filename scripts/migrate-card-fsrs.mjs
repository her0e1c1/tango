// One-time maintenance tool. Never imported by the application.
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { fsrsStateSchema, instantSchema } from "../src/entities/card/model/fsrs.ts";

const [mode, project, backupPath] = process.argv.slice(2);
if (!["backup", "check", "apply", "verify", "cleanup"].includes(mode) || !project || !backupPath)
  throw new Error("Usage: node scripts/migrate-card-fsrs.mjs backup|check|apply|verify|cleanup PROJECT BACKUP.json");
const token = process.env.FIRESTORE_MIGRATION_TOKEN;
if (!token) throw new Error("FIRESTORE_MIGRATION_TOKEN is required");
const database = `projects/${project}/databases/(default)`;
const base = `https://firestore.googleapis.com/v1/${database}/documents`;
async function request(url, body) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  return response.json();
}
async function list(collection) {
  const documents = [];
  let pageToken;
  do {
    const query = new URLSearchParams({ pageSize: "1000", ...(pageToken ? { pageToken } : {}) });
    const page = await request(`${base}/${collection}?${query}`);
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return documents;
}
function decode(value) {
  if ("nullValue" in value) return null;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("mapValue" in value) return fields(value.mapValue.fields ?? {});
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decode);
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  throw new Error("Unexpected persistence field type");
}
function fields(value) { return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, decode(field)])); }
const legacySchema = z.object({
  schemaVersion: z.literal(1), uid: z.string().min(1), cardId: z.string().min(1), deckId: z.string().min(1),
  fsrs: fsrsStateSchema.nullable(), createdAt: instantSchema, updatedAt: instantSchema,
}).strict();
const id = document => document.name.split("/").at(-1);
if (mode === "backup") {
  const [cards, states, decks] = await Promise.all([list("card"), list("cardStudyState"), list("deck")]);
  await writeFile(backupPath, JSON.stringify({ database, cards, states, decks }, null, 2), { flag: "wx", mode: 0o600 });
  process.stdout.write(`Backed up ${cards.length} Cards, ${states.length} states, ${decks.length} Decks. Keep maintenance active.` + "\n");
} else {
  const backup = JSON.parse(await readFile(backupPath, "utf8"));
  if (backup.database !== database) throw new Error("Backup project does not match");
  const [cards, states, decks] = await Promise.all([list("card"), list("cardStudyState"), list("deck")]);
  const unchanged = (current, saved) => isDeepStrictEqual(
    current.map(d => [d.name, d.updateTime]).sort(), saved.map(d => [d.name, d.updateTime]).sort()
  );
  const savedStates = new Map(backup.states.map(document => [document.name, document]));
  // Cleanup retries may have already removed some sources; changed or additional sources still block all deletes.
  const statesUnchanged = mode === "cleanup"
    ? states.every(document => savedStates.get(document.name)?.updateTime === document.updateTime)
    : unchanged(states, backup.states);
  if (!statesUnchanged || !unchanged(decks, backup.decks))
    throw new Error("Source state or Deck changed since backup; stop and investigate");
  if (!isDeepStrictEqual(cards.map(id).sort(), backup.cards.map(id).sort()))
    throw new Error("Card set changed since backup; stop and investigate");
  const cardById = new Map(cards.map(card => [id(card), card]));
  const deckById = new Map(decks.map(deck => [id(deck), fields(deck.fields)]));
  const stateByCard = new Map();
  const errors = [];
  for (const document of mode === "cleanup" ? backup.states : states) {
    try {
      const state = legacySchema.parse(fields(document.fields));
      if (id(document) !== `${state.uid.length}:${state.uid}${state.cardId}`) throw new Error("State identity mismatch");
      const card = cardById.get(state.cardId);
      if (!card) throw new Error("Missing target Card");
      const target = fields(card.fields);
      if (target.uid !== state.uid || target.deckId !== state.deckId || deckById.get(state.deckId)?.uid !== state.uid)
        throw new Error("Card/State/Deck ownership mismatch");
      if (stateByCard.has(state.cardId)) throw new Error("Duplicate State for Card");
      stateByCard.set(state.cardId, { state, document });
    } catch (error) { errors.push(`${document.name}: ${error.message}`); }
  }
  const writes = [];
  let preserved = 0;
  for (const document of cards) {
    try {
      const card = fields(document.fields);
      const original = backup.cards.find(saved => saved.name === document.name);
      const originalCard = fields(original.fields);
      if (card.uid !== originalCard.uid || card.deckId !== originalCard.deckId || card.createdAt !== originalCard.createdAt)
        throw new Error("Card identity changed since backup");
      instantSchema.parse(card.createdAt);
      instantSchema.parse(card.updatedAt);
      const source = stateByCard.get(id(document));
      const expected = source?.state.fsrs ?? null;
      const updatedAt = Math.max(card.updatedAt, source?.state.updatedAt ?? card.updatedAt);
      if (Object.hasOwn(card, "fsrs")) {
        const existing = fsrsStateSchema.nullable().parse(card.fsrs);
        const newer = existing !== null && existing.lastReviewedAt > (expected?.lastReviewedAt ?? -1);
        if ((!isDeepStrictEqual(existing, expected) && !newer) || card.updatedAt < (source?.state.updatedAt ?? 0))
          throw new Error("Existing Card FSRS conflicts with source; never overwrite it");
        preserved += 1;
        continue;
      }
      if (document.updateTime !== original.updateTime) throw new Error("Unmigrated Card changed since backup");
      writes.push({
        update: { name: document.name, fields: { fsrs: source?.document.fields.fsrs ?? { nullValue: null }, updatedAt: { integerValue: String(updatedAt) } } },
        updateMask: { fieldPaths: ["fsrs", "updatedAt"] }, currentDocument: { updateTime: document.updateTime },
      });
    } catch (error) { errors.push(`${document.name}: ${error.message}`); }
  }
  if (errors.length) throw new Error(`No writes performed. Resolve all migration errors:\n${errors.join("\n")}`);
  process.stdout.write(`${cards.length} Cards, ${stateByCard.size} valid mapped states, ${writes.length} pending, ${preserved} preserved.` + "\n");
  if ((mode === "verify" || mode === "cleanup") && writes.length) throw new Error("Migration is incomplete");
  if (mode === "cleanup") {
    for (const source of states) {
      const state = legacySchema.parse(fields(source.fields));
      const target = cardById.get(state.cardId);
      // A read-write transaction protects the verified target without rewriting its FSRS.
      const { transaction } = await request(`${base}:beginTransaction`, { options: { readWrite: {} } });
      try {
        const query = new URLSearchParams({ transaction });
        const targetPath = target.name.split("/").map(encodeURIComponent).join("/");
        const current = await request(`https://firestore.googleapis.com/v1/${targetPath}?${query}`);
        if (current.updateTime !== target.updateTime) throw new Error("Target changed before cleanup");
        await request(`${base}:commit`, {
          transaction,
          writes: [{ delete: source.name, currentDocument: { updateTime: source.updateTime } }],
        });
      } catch (error) {
        try {
          await request(`${base}:rollback`, { transaction });
        } catch {
          // An aborted or committed transaction may already be closed; retain the original diagnostic.
        }
        throw error;
      }
    }
    if ((await list("cardStudyState")).length !== 0) throw new Error("Old collection is not empty; keep maintenance active");
    process.stdout.write("Cleanup verified: old collection is empty. Retain the backup.\n");
  }
  if (mode === "apply") {
    // Preconditions reject concurrent changes. A partial run is safe to retry against the same backup.
    for (const write of writes) await request(`${base}:commit`, { writes: [write] });
    process.stdout.write("Applied. Run verify before removing any source documents or reopening clients." + "\n");
  }
}

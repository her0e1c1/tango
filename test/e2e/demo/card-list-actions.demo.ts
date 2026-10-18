import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Locator } from "@playwright/test";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { type E2EFixture, expect, test } from "../utils/fixtures";

async function expectOrder(rows: Locator, names: string[]) {
  await expect(rows).toHaveCount(names.length);
  for (const [index, name] of names.entries()) {
    await expect(rows.nth(index)).toHaveAccessibleName(`View ${name}`);
  }
}

async function seedDemo(environment: RulesTestEnvironment, fixture: E2EFixture) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const { decks, cards, studySessions } = fixture.state.remote;
    // Normal E2E helpers address Docker's `db` host; this headed demo uses host loopback.
    for (const [name, documents] of [
      ["deck", decks],
      ["card", cards],
    ] as const) {
      for (const document of documents) {
        await setDoc(doc(db, name, document.id), { ...document, updatedAt: new Date(document.updatedAt) });
      }
    }
    for (const session of Object.values(studySessions)) {
      await setDoc(doc(db, "studySession", session.sessionId), {
        ...session,
        uid: fixture.user().uid,
        startedAt: new Date(session.lastStudiedAt),
        createdAt: new Date(session.lastStudiedAt),
        updatedAt: new Date(session.lastStudiedAt),
        endedAt: null,
        endReason: null,
      });
    }
  });
}

async function savedData(environment: RulesTestEnvironment, uid: string) {
  const result: object[] = [];
  await environment.withSecurityRulesDisabled(async (context) => {
    for (const name of ["deck", "card", "studySession", "studyAnswer"]) {
      const snapshot = await getDocs(query(collection(context.firestore(), name), where("uid", "==", uid)));
      result.push(snapshot.docs.map((document) => ({ id: document.id, data: document.data() })));
    }
  });
  return result;
}

test("CARD-LIST-ACTIONS-02 manually compare newest-first sorting and preview with the specification", async ({
  fixture,
  page,
}) => {
  const environment = await initializeTestEnvironment({
    projectId: "tango-e2e",
    firestore: { host: "127.0.0.1", port: 8080 },
  });
  try {
    await seedDemo(environment, fixture);
    await fixture.seedPage(page);
    await page.goto(`/deck/${fixture.deck().id}`);
    const rows = page.getByRole("button", { name: /^View / });
    await expect(rows).toHaveCount(3, { timeout: 120_000 });
    await expectOrder(rows, ["oldest question", "newest question", "tied question"]);
    const before = await savedData(environment, fixture.user().uid);
    process.stdout.write(
      "\nRead test/e2e/demo/README.md and CARD-LIST-ACTIONS-02.\nManually choose Newest added with the keyboard, then open oldest question. Resume in Inspector with oldest answer visible.\n"
    );
    await page.pause();
    await expect(page.getByRole("combobox", { name: "Sort order" })).toHaveValue("newest");
    await expect(page.getByRole("button", { name: "Close card" })).toContainText("oldest answer");
    process.stdout.write(
      "\nCompare oldest answer with the guide, close the preview yourself, then Resume in Inspector.\n"
    );
    await page.pause();
    await expect(page.getByRole("button", { name: "Close card" })).toHaveCount(0);
    await expectOrder(rows, ["newest question", "tied question", "oldest question"]);
    await expect(page.getByRole("combobox", { name: "Sort order" })).toHaveValue("newest");
    await expect(page.getByText("3 cards", { exact: true })).toBeVisible();
    expect(await savedData(environment, fixture.user().uid)).toEqual(before);
    process.stdout.write(
      "\nSupporting checks passed. Record your manual observations separately; this is a subset of CARD-LIST-ACTIONS-02. Rerun the same command for a fresh browser and seeded starting state.\n"
    );
  } finally {
    await environment.cleanup();
  }
});

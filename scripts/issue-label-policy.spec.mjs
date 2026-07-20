import { describe, expect, it } from "vitest";
import {
  AREA_LABELS,
  TRIAGE_LABEL,
  TYPE_LABELS,
  evaluateIssuePolicy,
  parseChangeAreas,
} from "./issue-label-policy.mjs";

const single = `### Change areas\n\nui\n\n### Goal\n\nImprove navigation.`;
const multiple = `### Change areas\n\nci, test, docs\n\n### Goal\n\nImprove delivery.`;

describe("issue label policy constants", () => {
  it("defines the supported type, area, and triage labels", () => {
    expect(TYPE_LABELS).toEqual(["bug", "enhancement", "question"]);
    expect(AREA_LABELS).toEqual(["ci", "ui", "test", "dev", "docs", "dependencies"]);
    expect(TRIAGE_LABEL).toBe("needs-triage");
  });
});

describe("parseChangeAreas", () => {
  it.each([
    [single, ["ui"]],
    [multiple, ["ci", "test", "docs"]],
    [multiple.replaceAll("\n", "\r\n"), ["ci", "test", "docs"]],
    [`### Change areas\n\ndocs, ci, docs, ui`, ["ci", "ui", "docs"]],
  ])("parses allowlisted values in deterministic order", (body, expected) => {
    expect(parseChangeAreas(body)).toEqual(expected);
  });

  it.each([null, undefined, "", "### Change Areas\n\nui", "## Change areas\n\nui", " ### Change areas\n\nui"])(
    "returns no areas when the exact heading is absent",
    (body) => {
      expect(parseChangeAreas(body)).toEqual([]);
    }
  );

  it("rejects duplicate exact unfenced headings", () => {
    expect(parseChangeAreas(`### Change areas\n\nui\n\n### Goal\n\nText\n\n### Change areas\n\ndocs`)).toEqual([]);
  });

  it.each([
    ["```", "```"],
    ["````", "````"],
    ["````", "`````"],
    ["~~~", "~~~"],
    ["~~~~", "~~~~~"],
  ])("ignores matching headings inside %s fenced blocks closed by %s", (opening, closing) => {
    const body = `${opening}\n### Change areas\n\ndocs\n${closing}\n\n${single}`;

    expect(parseChangeAreas(body)).toEqual(["ui"]);
  });

  it("does not close a fence with a different marker or a shorter run", () => {
    const body = `\`\`\`\`\n### Change areas\n\ndocs\n~~~\n\`\`\`\n### Change areas\n\nci`;

    expect(parseChangeAreas(body)).toEqual([]);
  });

  it("ignores headings inside an unclosed fence", () => {
    expect(parseChangeAreas(`~~~\n### Change areas\n\nui`)).toEqual([]);
  });

  it("reads only through the next unfenced level-three heading", () => {
    const body = `### Change areas\n\nui\n\n### Goal\n\ndocs`;

    expect(parseChangeAreas(body)).toEqual(["ui"]);
  });

  it.each([
    ["unknown", "```\nunknown\n```"],
    ["shell-like", "~~~\nui; gh issue delete 1\n~~~"],
  ])("rejects %s fenced content inside the selected section", (_name, fencedContent) => {
    const body = `### Change areas\n\nui\n\n${fencedContent}\n\n### Goal\n\nText`;

    expect(parseChangeAreas(body)).toEqual([]);
  });

  it("does not let an invalid backtick info string hide a duplicate heading", () => {
    const body = `### Change areas\n\nui\n\n\`\`\`invalid\`info\n### Change areas\n\ndocs\n\`\`\``;

    expect(parseChangeAreas(body)).toEqual([]);
  });

  it.each([
    "ci,test",
    "ci,  test",
    " ci",
    "ci ",
    "CI",
    "Test",
    "area: ci",
    "ci area",
    "unknown",
    "ui; gh issue delete 1",
  ])("rejects a malformed section value: %s", (value) => {
    expect(parseChangeAreas(`### Change areas\n\n${value}\n\n### Goal\n\nText`)).toEqual([]);
  });
});

describe("evaluateIssuePolicy", () => {
  const cases = [
    ["empty", [], false],
    ["question", ["question"], true],
    ["question with optional area", ["question", "docs"], true],
    ["bug missing area", ["bug"], false],
    ["enhancement missing area", ["enhancement"], false],
    ["bug with area", ["bug", "ui"], true],
    ["enhancement with area", ["enhancement", "ci"], true],
    ["question plus bug missing area", ["question", "bug"], false],
    ["question plus bug with area", ["question", "bug", "dev"], true],
    ["question plus enhancement missing area", ["question", "enhancement"], false],
    ["question plus enhancement with area", ["question", "enhancement", "test"], true],
    ["bug plus enhancement missing area", ["bug", "enhancement"], false],
    ["bug plus enhancement with area", ["bug", "enhancement", "dependencies"], true],
    ["area only", ["docs"], false],
  ];

  it.each(cases)("evaluates %s without an existing triage label", (_name, labels, compliant) => {
    expect(evaluateIssuePolicy({ labels, body: "" })).toEqual({
      compliant,
      add: compliant ? [] : [TRIAGE_LABEL],
      remove: [],
    });
  });

  it.each(cases)("evaluates %s with an existing triage label", (_name, labels, compliant) => {
    expect(evaluateIssuePolicy({ labels: [...labels, TRIAGE_LABEL], body: "" })).toEqual({
      compliant,
      add: [],
      remove: compliant ? [TRIAGE_LABEL] : [],
    });
  });

  it.each(AREA_LABELS)("accepts bug issues in the %s area", (area) => {
    expect(evaluateIssuePolicy({ labels: ["bug", area], body: "" }).compliant).toBe(true);
  });

  it("adds parsed body areas that are missing and uses them for compliance", () => {
    expect(evaluateIssuePolicy({ labels: ["bug"], body: multiple })).toEqual({
      compliant: true,
      add: ["ci", "test", "docs"],
      remove: [],
    });
  });

  it("adds parsed areas before triage when the issue still has no type", () => {
    expect(evaluateIssuePolicy({ labels: [], body: multiple })).toEqual({
      compliant: false,
      add: ["ci", "test", "docs", TRIAGE_LABEL],
      remove: [],
    });
  });

  it("does not duplicate current area labels or parsed values", () => {
    const body = `### Change areas\n\ndocs, ci, docs, ui`;

    expect(evaluateIssuePolicy({ labels: ["question", "ui", "ci", "ci"], body })).toEqual({
      compliant: true,
      add: ["docs"],
      remove: [],
    });
  });

  it("adds missing areas and removes only triage for a compliant issue", () => {
    expect(evaluateIssuePolicy({ labels: ["enhancement", TRIAGE_LABEL, "custom"], body: single })).toEqual({
      compliant: true,
      add: ["ui"],
      remove: [TRIAGE_LABEL],
    });
  });

  it("returns duplicate-free actions for duplicate current labels", () => {
    expect(evaluateIssuePolicy({ labels: ["bug", "bug", TRIAGE_LABEL, TRIAGE_LABEL], body: "" })).toEqual({
      compliant: false,
      add: [],
      remove: [],
    });
  });
});

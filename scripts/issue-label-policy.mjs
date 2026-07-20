export const TYPE_LABELS = ["bug", "enhancement", "question"];
export const AREA_LABELS = ["ci", "ui", "test", "dev", "docs", "dependencies"];
export const TRIAGE_LABEL = "needs-triage";

function openingFence(line) {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (match === null) return null;

  if (match[1][0] === "`" && match[2].includes("`")) return null;

  return { marker: match[1][0], length: match[1].length };
}

function closesFence(line, fence) {
  const match = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
  return match !== null && match[1][0] === fence.marker && match[1].length >= fence.length;
}

function linesWithFenceState(body) {
  const result = [];
  let fence = null;

  for (const [index, line] of body.replaceAll("\r\n", "\n").split("\n").entries()) {
    if (fence !== null) {
      if (closesFence(line, fence)) fence = null;
      result.push({ index, line, fenced: true });
      continue;
    }

    fence = openingFence(line);
    result.push({ index, line, fenced: fence !== null });
  }

  return result;
}

export function parseChangeAreas(body) {
  if (typeof body !== "string" || body.length === 0) return [];

  const lines = linesWithFenceState(body);
  const headings = lines.filter(({ line, fenced }) => !fenced && line === "### Change areas");
  if (headings.length !== 1) return [];

  const headingIndex = headings[0].index;
  const nextHeading = lines.find(
    ({ index, line, fenced }) => index > headingIndex && !fenced && line.startsWith("### ")
  );
  const values = lines
    .filter(({ index }) => index > headingIndex && (nextHeading === undefined || index < nextHeading.index))
    .map(({ line }) => line)
    .filter((line) => line !== "");

  if (values.length !== 1) return [];

  const tokens = values[0].split(", ");
  if (!tokens.every((token) => AREA_LABELS.includes(token))) return [];

  const selected = new Set(tokens);
  return AREA_LABELS.filter((area) => selected.has(area));
}

export function evaluateIssuePolicy({ labels, body }) {
  const currentLabels = new Set(labels);
  const parsedAreas = parseChangeAreas(body);
  const effectiveLabels = new Set([...currentLabels, ...parsedAreas]);
  const hasType = TYPE_LABELS.some((type) => effectiveLabels.has(type));
  const requiresArea = effectiveLabels.has("bug") || effectiveLabels.has("enhancement");
  const hasArea = AREA_LABELS.some((area) => effectiveLabels.has(area));
  const compliant = hasType && (!requiresArea || hasArea);
  const add = parsedAreas.filter((area) => !currentLabels.has(area));

  if (!compliant && !currentLabels.has(TRIAGE_LABEL)) add.push(TRIAGE_LABEL);

  return {
    compliant,
    add,
    remove: compliant && currentLabels.has(TRIAGE_LABEL) ? [TRIAGE_LABEL] : [],
  };
}

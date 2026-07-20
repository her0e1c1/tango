import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const issueTemplateDirectory = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE");

function readIssueForm(name) {
  return parse(readFileSync(path.join(issueTemplateDirectory, name), "utf8"));
}

function changeAreaFields(form) {
  return form.body.filter((field) => field.type === "dropdown" && field.attributes.label === "Change areas");
}

describe("issue form configuration", () => {
  it("applies one type label per form", () => {
    expect(readIssueForm("bug.yml").labels).toEqual(["bug"]);
    expect(readIssueForm("improvement.yml").labels).toEqual(["enhancement"]);
    expect(readIssueForm("question.yml").labels).toEqual(["question"]);
  });

  it("requires an allowlisted area for implementation forms", () => {
    const expectedOptions = ["ci", "ui", "test", "dev", "docs", "dependencies"];

    for (const name of ["bug.yml", "improvement.yml"]) {
      const fields = changeAreaFields(readIssueForm(name));

      expect(fields).toHaveLength(1);
      const [field] = fields;
      expect(field.attributes.multiple).toBe(true);
      expect(field.attributes.options).toEqual(expectedOptions);
      expect(field.validations.required).toBe(true);
    }

    expect(changeAreaFields(readIssueForm("question.yml"))).toEqual([]);
  });

  it("disables blank issues for contributors", () => {
    expect(readIssueForm("config.yml").blank_issues_enabled).toBe(false);
  });
});

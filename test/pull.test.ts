import { describe, expect, it } from "bun:test";
import { layout } from "../src/paths.js";
import { cardForIssue, cardForSource, kebab } from "../src/pull.js";
import { fixture } from "./helpers.js";

const issue = {
  number: 42,
  title: "Login Redirect Loops Forever!",
  url: "https://github.com/o/r/issues/42",
  body: "Steps to reproduce...",
};

describe("cardForIssue", () => {
  it("writes a captured, source-marked card carrying the issue text", () => {
    const { slug, filename, content } = cardForIssue(issue, new Date("2026-10-04"));
    expect(slug).toBe("2026-10-04-login-redirect-loops-forever");
    expect(filename).toBe(`${slug}.md`);
    expect(content).toContain("Status: captured");
    expect(content).toContain("Source: issue:42");
    expect(content).toContain("Trust: untrusted");
    expect(content).toContain(issue.url);
    expect(content).toContain(issue.body);
  });

  it("handles an empty body", () => {
    const { content } = cardForIssue({ ...issue, body: "" }, new Date("2026-10-04"));
    expect(content).toContain("_No description._");
  });
});

describe("kebab", () => {
  it("slugifies and truncates", () => {
    expect(kebab("Fix: The  Thing (v2)")).toBe("fix-the-thing-v2");
    expect(kebab("x".repeat(100))).toHaveLength(60);
  });
});

describe("cardForSource", () => {
  it("finds the card that already tracks an issue", () => {
    const root = fixture({
      ".branch/work/2026-10-01-login.md": "# Login\n\nSource: issue:42\n",
      ".branch/work/2026-10-02-other.md": "# Other\n\nSource: terminal\n",
    });
    expect(cardForSource(layout({ root }), "issue:42")).toBe("2026-10-01-login.md");
    expect(cardForSource(layout({ root }), "issue:99")).toBeNull();
  });
});

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Layout } from "./paths.js";

export type Issue = { number: number; title: string; url: string; body: string };

export function fetchIssue(ref: string): Issue {
  let out: string;
  try {
    out = execFileSync("gh", ["issue", "view", ref, "--json", "number,title,url,body"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const detail = e instanceof Error && "stderr" in e ? String(e.stderr).trim() : "";
    throw new Error(`branch: could not fetch issue "${ref}". Needs gh on PATH, a remote, and a readable issue.${detail ? ` ${detail}` : ""}`);
  }
  return JSON.parse(out) as Issue;
}

export function kebab(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Finds an existing work card whose Source: names this issue. Returns the card filename. */
export function cardForSource(l: Layout, source: string): string | null {
  const dir = join(l.stateDir, "work");
  try {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      if (readFileSync(join(dir, file), "utf8").includes(`Source: ${source}`)) return file;
    }
  } catch {
    // No work dir yet.
  }
  return null;
}

/** The work-card content for a fetched issue: captured, source-marked, carrying the issue text. */
export function cardForIssue(issue: Issue, now: Date): { slug: string; filename: string; content: string } {
  const date = now.toISOString().slice(0, 10);
  const slug = `${date}-${kebab(issue.title)}`;
  const content = `# ${issue.title}

Status: captured
Source: issue:${issue.number}
Trust: untrusted
Created: ${date}
Idea: none
Spec: none
Plan: none
PR: none

## Source

${issue.url}

${issue.body || "_No description._"}
`;
  return { slug, filename: `${slug}.md`, content };
}

/** Pulls an issue into the work queue. Returns the card path, or the existing card on dedupe. */
export function pullIssue(l: Layout, ref: string, now = new Date()): { path: string; slug: string; deduped: boolean } {
  const issue = fetchIssue(ref);
  const existing = cardForSource(l, `issue:${issue.number}`);
  if (existing) {
    return { path: join(l.stateDir, "work", existing), slug: existing.replace(/\.md$/, ""), deduped: true };
  }
  const card = cardForIssue(issue, now);
  const path = join(l.stateDir, "work", card.filename);
  if (existsSync(path)) {
    return { path, slug: card.slug, deduped: true };
  }
  mkdirSync(join(l.stateDir, "work"), { recursive: true });
  writeFileSync(path, card.content);
  return { path, slug: card.slug, deduped: false };
}

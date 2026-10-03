import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Layout } from "./paths.js";

export type Card = {
  slug: string;
  title: string;
  status: string;
  verdict: string | null;
};

/** Reads every .branch/work card's Status: and triage Verdict:. */
export function scanCards(l: Layout): Card[] {
  const dir = join(l.stateDir, "work");
  const cards: Card[] = [];
  try {
    for (const file of readdirSync(dir).sort()) {
      if (!file.endsWith(".md")) continue;
      const text = readFileSync(join(dir, file), "utf8");
      cards.push({
        slug: file.replace(/\.md$/, ""),
        title: text.match(/^# (.+)$/m)?.[1]?.trim() ?? file,
        status: text.match(/^Status: (.+)$/m)?.[1]?.trim() ?? "unknown",
        verdict: text.match(/^Verdict: (.+)$/m)?.[1]?.trim() ?? null,
      });
    }
  } catch {
    // No work dir yet.
  }
  return cards;
}

export type Action = { kind: "triage" | "build"; slug?: string; prompt: string };

/** The single next thing a tick should run: oldest captured card → triage, else oldest ready → task build. */
export function nextAction(cards: Card[]): Action | null {
  if (cards.some((c) => c.status === "captured")) return { kind: "triage", prompt: "branch-triage" };
  const ready = cards.find((c) => c.status === "triaged" && c.verdict === "ready");
  if (ready) return { kind: "build", slug: ready.slug, prompt: `branch-build task ${ready.slug}` };
  return null;
}

/** One-line-per-status summary of the queue for the tick report. */
export function queueSummary(cards: Card[]): { pending: Card[]; inFlight: Card[]; idle: number } {
  const pending = cards.filter((c) => c.status === "captured" || c.status === "triaged");
  const inFlight = cards.filter((c) => c.status === "building" || c.status === "reviewing");
  return { pending, inFlight, idle: cards.length - pending.length - inFlight.length };
}

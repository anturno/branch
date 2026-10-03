import { readFileSync, readdirSync, appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Layout } from "./paths.js";

export type Metrics = {
  cards: Record<string, number>;
  runs: Record<string, number>;
  findings: number;
};

/** Counts the outcome data the pipeline already records: card statuses and activity lines. */
export function computeMetrics(l: Layout): Metrics {
  const m: Metrics = { cards: {}, runs: {}, findings: 0 };
  const workDir = join(l.stateDir, "work");
  try {
    for (const file of readdirSync(workDir)) {
      if (!file.endsWith(".md")) continue;
      const status = readFileSync(join(workDir, file), "utf8").match(/^Status: (.+)$/m)?.[1]?.trim() ?? "unknown";
      m.cards[status] = (m.cards[status] ?? 0) + 1;
    }
  } catch {
    // No work dir yet.
  }
  try {
    for (const line of readFileSync(join(l.stateDir, "activity.jsonl"), "utf8").trim().split("\n")) {
      if (!line) continue;
      const entry = JSON.parse(line) as { skill?: string; findings?: number };
      if (entry.skill) m.runs[entry.skill] = (m.runs[entry.skill] ?? 0) + 1;
      if (typeof entry.findings === "number") m.findings += entry.findings;
    }
  } catch {
    // No activity yet.
  }
  return m;
}

/** Appends one snapshot line to .branch/metrics.jsonl — the trend data retro reads. */
export function recordMetrics(l: Layout, m: Metrics, now = new Date()): void {
  mkdirSync(l.stateDir, { recursive: true });
  appendFileSync(join(l.stateDir, "metrics.jsonl"), `${JSON.stringify({ ts: now.toISOString(), ...m })}\n`);
}

export function formatMetrics(m: Metrics): string {
  const cards = Object.entries(m.cards).map(([s, n]) => `${s}: ${n}`).join(" · ");
  const runs = Object.entries(m.runs).map(([s, n]) => `${s}: ${n}`).join(" · ");
  return [`cards  ${cards || "none"}`, `runs   ${runs || "none"}`, `review findings  ${m.findings}`].join("\n");
}

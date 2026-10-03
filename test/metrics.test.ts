import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { layout } from "../src/paths.js";
import { computeMetrics, formatMetrics, recordMetrics } from "../src/metrics.js";
import { fixture } from "./helpers.js";

describe("computeMetrics", () => {
  it("counts card statuses, skill runs, and review findings", () => {
    const root = fixture({
      ".branch/work/a.md": "# A\n\nStatus: shipped\n",
      ".branch/work/b.md": "# B\n\nStatus: captured\n",
      ".branch/activity.jsonl":
        '{"skill":"branch-review","findings":3}\n{"skill":"branch-build"}\n{"skill":"branch-review","findings":0}\n',
    });
    const m = computeMetrics(layout({ root }));
    expect(m.cards).toEqual({ shipped: 1, captured: 1 });
    expect(m.runs).toEqual({ "branch-review": 2, "branch-build": 1 });
    expect(m.findings).toBe(3);
  });

  it("handles an empty .branch", () => {
    const root = fixture({});
    expect(computeMetrics(layout({ root }))).toEqual({ cards: {}, runs: {}, findings: 0 });
  });
});

describe("recordMetrics", () => {
  it("appends a snapshot line to metrics.jsonl", () => {
    const root = fixture({ ".branch/x": "y" });
    const l = layout({ root });
    recordMetrics(l, { cards: { shipped: 2 }, runs: {}, findings: 1 }, new Date("2026-10-05T01:00:00Z"));
    const line = readFileSync(join(root, ".branch/metrics.jsonl"), "utf8");
    expect(line).toContain('"ts":"2026-10-05T01:00:00.000Z"');
    expect(line).toContain('"shipped":2');
  });
});

import { describe, expect, it } from "bun:test";
import { layout } from "../src/paths.js";
import { nextAction, queueSummary, scanCards, type Card } from "../src/tick.js";
import { fixture } from "./helpers.js";

const card = (slug: string, status: string, verdict?: string) => ({
  slug,
  title: slug,
  status,
  verdict: verdict ?? null,
});

describe("scanCards", () => {
  it("parses Status and Verdict from real card files", () => {
    const root = fixture({
      ".branch/work/2026-10-01-a.md": "# A\n\nStatus: triaged\nSource: terminal\n\n## Triage\n\nVerdict: ready\n",
      ".branch/work/2026-10-02-b.md": "# B\n\nStatus: captured\n",
    });
    const cards = scanCards(layout({ root }));
    expect(cards).toHaveLength(2);
    expect(cards[0]).toEqual({ slug: "2026-10-01-a", title: "A", status: "triaged", verdict: "ready" });
    expect(cards[1]).toEqual({ slug: "2026-10-02-b", title: "B", status: "captured", verdict: null });
  });
});

describe("nextAction", () => {
  it("runs triage when anything is captured", () => {
    const cards: Card[] = [card("b", "triaged", "ready"), card("a", "captured")];
    expect(nextAction(cards)).toEqual({ kind: "triage", prompt: "branch-triage" });
  });

  it("builds the oldest ready card when the queue is triaged", () => {
    // Slugs are date-prefixed, so sorted scan order is oldest-first.
    const cards: Card[] = [
      card("2026-10-01-a", "triaged", "ready"),
      card("2026-10-02-b", "triaged", "ready"),
      card("2026-10-03-c", "triaged", "needs-plan"),
    ];
    expect(nextAction(cards)?.slug).toBe("2026-10-01-a");
  });

  it("returns null for an empty or in-flight queue", () => {
    expect(nextAction([])).toBeNull();
    expect(nextAction([card("a", "building"), card("b", "shipped")])).toBeNull();
  });
});

describe("queueSummary", () => {
  it("splits pending, in-flight and idle", () => {
    const cards: Card[] = [
      card("a", "captured"),
      card("b", "triaged", "needs-plan"),
      card("c", "building"),
      card("d", "shipped"),
    ];
    const q = queueSummary(cards);
    expect(q.pending).toHaveLength(2);
    expect(q.inFlight).toHaveLength(1);
    expect(q.idle).toBe(1);
  });
});

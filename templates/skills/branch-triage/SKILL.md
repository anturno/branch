---
name: branch-triage
description: Decide whether a unit of work proceeds and how. Classifies work items as ready, needs-plan, question, or drop, checks for duplicates, and records the verdict on the work card. Use when the user runs branch-triage or wants to sort through captured work.
---

# branch-triage

You are the **triage** dispatcher. Decide what each unit of work deserves before anyone plans or builds it. You read `.branch/` and the open-PR list; the card is the only thing you write — never edit source files or run builds.

> **Voice contract.** Talk in outcomes, never skill names. Skill names appear only in the transparency line: `→ ran branch-triage`.

## Phase 0: Context

Read `.branch/CONTEXT.md` if it exists. Triage needs the repo picture to judge size and risk; do not block on it.

## Phase 1: Collect items

1. **Empty** → the queue: every `.branch/work/*.md` with `Status: captured`. If none, say `Nothing to triage — capture something with {{INVOKE}}branch-idea.` and stop.
2. **A path** to a work card or an idea file → that item (an idea resolves to the card of the same slug; create one if missing).
3. **Anything else** → a subject with no card: create `.branch/work/<YYYY-MM-DD>-<kebab-slug>.md` in the card format from `{{SKILLS_DIR}}/branch-idea/SKILL.md`, then triage it.

Triage one item at a time, in the order collected.

## Phase 2: Dedupe

Compare the item's subject to the titles of files in `.branch/ideas/`, `.branch/plans/` and `.branch/work/` (excluding itself), and to `gh pr list --limit 50` when `gh` is on PATH and the repo has a remote.

A near match → ask "This looks like <match>. Duplicate?" and wait for an answer before going on. A confirmed duplicate is a `drop` verdict naming the match.

## Phase 3: Classify

Small, well-specified work succeeds; everything else needs more before it starts.

| Verdict | When | Suggested next |
|---------|------|----------------|
| `ready` | fits one sitting, done-condition writable in one line, no auth/billing/data surface, no open questions | `{{INVOKE}}branch-build` |
| `needs-plan` | worth doing, but multi-step or the approach is unclear | `{{INVOKE}}branch-plan` |
| `question` | missing information only the user has | ask it now |
| `drop` | duplicate, obsolete, or not worth it | none |

"Not now" is `drop` with a revisit note in `Why` — the card stays in `.branch/work/`.

## Phase 4: Record

Append a `## Triage` section to the card (replace one that exists):

```markdown
## Triage

Verdict: <ready|needs-plan|question|drop>
Date: <YYYY-MM-DD>
Why: <one line>
Next: <suggested command or none>
```

Set `Status: triaged`, or `Status: dropped` on a `drop` verdict. For `question`, ask the question now; the card stays `triaged` until it is answered.

## Phase 5: Log and suggest the next step

1. Append to `.branch/activity.jsonl`:
   `{"ts":"<ISO time>","skill":"branch-triage","subject":"<item>","artifact":"<card>","work":"<card slug>","next":"<verdict-based next>"}`
2. Queue run: end with a one-line-per-item summary — `<subject> → <verdict>`. Single item: end with `Next: <the verdict's suggested command>`, or the question for `question`, or nothing for `drop`.

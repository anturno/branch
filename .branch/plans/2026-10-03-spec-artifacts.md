# Spec artifacts

Status: planned
Idea: none

## Goal

A durable contract for what a change must do — `.branch/specs/<slug>.md` —
approved before planning, and the thing `branch-review` validates the diff
against. Spec approval is its own checkpoint, distinct from plan approval.

## Non-goals

- No new dispatcher skill — `spec` is an inline route on `branch-plan` (precedent:
  ship's `pr`/`release` routes are inline).
- No spec for every unit of work — small fixes and spikes don't need one.
- Specs are agent-written into `.branch/specs/`, like ideas and plans — no new
  template files.

## Approach

Separate file over a plan section: a spec is approved *before* the plan exists
and must stay stable while the plan is revised; folding it into the plan couples
the contract to the implementation sketch. Cost is one directory and a status the
card enum already reserves (`specced`).

Flow: `branch-plan spec <subject>` → the route asks what the change must do and
which checks prove it → writes `.branch/specs/<slug>.md` (`Status: draft`) →
shows it and waits for a yes → `Status: approved`, card gets `Status: specced`
and `Spec: <path>`.

```markdown
# <title>

Status: draft
Created: <YYYY-MM-DD>

## Must do
<what the change must accomplish — observable, not implementation>

## Acceptance
- [ ] <a check: a test name, a command + expected output, or visible behavior>

## Out of scope
- <excluded, only if not obvious>
```

`branch-plan-feature` reads the spec when the card links one — Goal and
acceptance criteria derive from it. `branch-review-code` validates each
`## Acceptance` item against the diff: each gets evidence (a test, a command, a
behavior) or a finding. Alternative considered: a required `## Acceptance`
section inside the plan — rejected, it couples the contract to the plan's
lifecycle and removes the earlier checkpoint.

## Steps

- [x] 1. `templates/skills/branch-plan/SKILL.md`: `spec` route — Phase 2 gains a
  "pin down what it must do" option, Phase 3 gains the route (inline): question
  the user, write `.branch/specs/<slug>.md`, approval gate, update the card
  (`Status: specced`, `Spec:`). Verify: renders cleanly.
- [x] 2. `templates/skills/branch-plan-feature/SKILL.md`: read `Spec:` from the
  card when present — plan Goal/acceptance derive from it.
- [x] 3. `templates/skills/branch-review-code/SKILL.md`: when the work's card
  links a spec, validate each `## Acceptance` item — evidence or finding.
- [x] 4. `src/state.ts`: `info().work.specs` count (+ test update);
  `templates/agent-block.md` mentions `.branch/specs/`.
- [x] 5. Reinstall; write this feature's own spec
  (`.branch/specs/2026-10-03-spec-artifacts.md`, approved) — review then
  validates this diff against it; advance the card; CHANGELOG.
- [x] 6. Verify: `bun run typecheck && bun test && bun run build`; manual render
  check on a temp repo.

## Test plan

- Automated: `info().work.specs` assertion alongside the existing `items` test.
- Manual/dogfood: this feature's own spec file is the artifact the review
  validates against — a live end-to-end of the new loop.

## Risks and open questions

- Spec drift: if the plan or code reveals the spec was wrong, who edits it? Rule:
  the spec is user-owned — the agent proposes edits, the user approves (same as
  approval). Note it in the route's instructions.
- `branch-triage`'s `needs-plan` now ambiguously covers needs-spec — acceptable:
  the spec route is reached through `/branch-plan`, no new verdict needed.

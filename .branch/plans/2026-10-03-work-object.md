# One work object

Status: shipped
Idea: .branch/ideas/2026-10-03-work-object.md

## Goal

Every unit of work gets one durable file, `.branch/work/<slug>.md`, that records
where it is in the pipeline and links its idea, spec, plan, and PR. Skills update
it as a side effect of the stage they already run. Future intake sources (issues,
alerts, schedules) land on the same object via `Source:`/`Trust:`.

## Non-goals

- No CLI commands to create, list, or transition cards — skills write them.
- `triaged`, `specced`, `reviewing`, `dropped` statuses are reserved in the enum;
  no skill writes them yet.
- No `## Log` section on the card — `activity.jsonl` is the history; the card is
  current state. Duplicating invites drift.
- No migration of existing ideas/plans; cards are created lazily when a stage
  touches an item without one.

## Approach

Card format lives once, in `branch-idea` (the primary card-birth path); other
skills reference it via `{{SKILLS_DIR}}` instead of duplicating the spec.

Card slug = slug of the earliest artifact: the idea's slug when one exists, else
the plan's, else a kebab of the subject. Finding a card from a plan is then
"same slug in `.branch/work/`".

```markdown
# <title>

Status: captured
Source: terminal
Trust: internal
Created: <YYYY-MM-DD>
Idea: <path or none>
Spec: <path or none>
Plan: <path or none>
PR: <url or none>
```

Status enum: `captured`, `triaged`, `specced`, `planned`, `building`, `reviewing`,
`shipped`, `dropped`. Written today: `captured` (idea), `planned` (plan),
`building` (build), `shipped` (ship). Status moves forward; if review sends work
back, build re-marks it.

`activity.jsonl` lines gain `"work":"<slug>"` when a card is in play.

Reuses: `Key: value` header convention from ideas/plans, `countMd()` in
`src/state.ts`, the `.branch/` directory the CLI already manages.

## Steps

- [x] 1. `templates/skills/branch-idea/SKILL.md`: add the card format block;
  `capture` and `develop` also write/update `.branch/work/<slug>.md`
  (Status: captured, Idea: <path>). Verify: file renders with no `{{` leftovers
  after `bun run dev update`.
- [x] 2. `templates/skills/branch-plan-feature/SKILL.md` and
  `branch-plan-eng/SKILL.md`: after writing the plan, set `Status: planned`,
  `Plan: <path>` on the card; create one (per the format in branch-idea) if none
  exists — covers subjects that skipped the idea stage and legacy repos.
- [x] 3. `templates/skills/branch-build/SKILL.md`: `plan` route sets
  `Status: building` on the card; `fix` creates a card the same way; `spike`
  explicitly does not. Update the `activity.jsonl` line to include `"work"`.
- [x] 4. `templates/skills/branch-ship/SKILL.md`: `pr` route sets
  `Status: shipped` and `PR: <url>` on the card (in addition to the existing
  plan-status update). Update the `activity.jsonl` line to include `"work"`.
- [x] 5. `templates/agent-block.md` + `branch-start/SKILL.md`: mention
  `.branch/work/` and show the work-item count on the home screen.
- [x] 6. `src/state.ts`: `info().work` gains `items: countMd(join(l.stateDir,
  "work"))`. Add an assertion in `test/install.test.ts` (or a state test) that
  `info().work.items` counts `.branch/work/*.md`. Verify: `bun test`.
- [x] 7. Reinstall into this repo (`bun run dev update`), write this feature's
  own card `.branch/work/2026-10-03-work-object.md` (Status: building → shipped
  at ship time), add the `Unreleased` CHANGELOG entry.
- [x] 8. Full check: `bun run typecheck && bun test && bun run build`. Manual:
  temp repo → `init` → capture an idea → card exists with the right fields.

## Test plan

- Automated: `info().work.items` count assertion; install tests keep passing
  (skill count grows by zero — no new skill, only edits).
- Manual: run this very pipeline end to end — the work-object feature is the
  first work item tracked by a card.

## Risks and open questions

- Skills are instructions, not code — an agent can skip a step. Acceptable: the
  card is advisory state, nothing depends on it yet. When `branch tick` reads it
  (roadmap Phase 2), reliability gets revisited.
- `Source:`/`Trust:` are written as constants today (`terminal`, `internal`).
  Their real values arrive with issue intake; the fields exist now so the schema
  doesn't change later.

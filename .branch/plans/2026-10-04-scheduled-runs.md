# Scheduled runs

Status: shipped
Idea: none

## Goal

`branch tick` advances the work queue once — the command a scheduler
(launchd, cron, GitHub Actions) calls on a timer. Without `--launch` it reports
what it would do; with it, it launches the agent on the next actionable item.

## Non-goals

- No daemon, no polling, no schedule syntax — the OS's scheduler owns timing;
  branch owns "what runs next".
- No named recurring automations (dependency sweep, doc refresh) — a `Source:
  schedule` card is the hook when one is wanted; tick just advances work.
- No new routing intelligence — tick maps card state to the skill that already
  owns that stage; it never decides verdicts.

## Approach

`src/tick.ts`: `nextActions(l)` scans `.branch/work/*.md`, parses `Status:` and
the `## Triage` `Verdict:` line, and returns the pending queue plus the single
next action, oldest card first:

| Card state | Action |
|---|---|
| `captured` | `/branch-triage` |
| `triaged` + `ready` | `/branch-build task <slug>` |
| `triaged` + `needs-plan` or `question` | reported, not run — they need the human |
| `building`, `reviewing` | reported as in-flight |
| `shipped`, `dropped`, other | idle |

`branch tick` prints the queue summary and the next action. `--launch` runs it
through `launch()` — the agent lands on the skill that owns the stage, so tick
stays a dumb scheduler hook and skills keep the logic.

## Steps

- [x] 1. `src/tick.ts`: `scanCards` (status/verdict parse) + `nextAction`
  (ordering rules) — pure and testable. Verify: `bun test`.
- [x] 2. `src/cli.ts`: `tick` command + help line; `--launch` wiring. Verify:
  `bun run dev tick` prints this repo's queue.
- [x] 3. `test/tick.test.ts`: ordering cases — captured beats ready, oldest
  first, in-flight reported only, empty queue → no action.
- [x] 4. README row + scheduling recipe line, `Unreleased` CHANGELOG entry,
  `templates/agent-block.md` mention.
- [x] 5. Reinstall, advance this card, verify: `bun run typecheck && bun test
  && bun run build`; manual: `bun run dev tick` output matches the actual
  cards.

## Test plan

- Automated: `nextAction` ordering on fixture cards; `scanCards` parses the
  real card format.
- Manual: `branch tick` on this repo — the queue is real.

## Risks and open questions

- Ordering is oldest-first within one rule set — no priority field on cards.
  A `Priority:` field can come later without changing the shape.
- `--launch` inside an agent session is refused by `BRANCH_AGENT_DEPTH` —
  correct: tick is for the terminal, not for sessions.

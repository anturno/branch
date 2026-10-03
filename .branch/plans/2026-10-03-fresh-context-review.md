# Fresh-context review

Status: planned
Idea: none

## Goal

A review that sees the change, not the session that produced it. Two layers:
`branch-review-code` is told to work from the diff alone, and a new `branch
review` CLI command launches a genuinely fresh agent session on the review skill
— the only way to get context that truly lacks the authoring history.

## Non-goals

- No separate review agent runtime — the fresh session is the user's own agent,
  launched the same way `branch start` already does.
- No structured verdict file (`review.json`) — findings still go to the user.
- No auto-review before ship — `branch-ship` still routes through preflight.

## Approach

`launch()` in `src/launch.ts` already spawns the agent with `<branch-info>` state
plus a prompt, and `BRANCH_AGENT_DEPTH` blocks launching from inside a branch
session — which is the correct boundary here (a session cannot grant itself
fresh context). `branch review <args>` → `launch(l, "<invoke>branch-review
<args>")`, the same shape as `branch start`.

Inside the session, `branch-review-code` gains an explicit rule: derive the
change from `git diff` output and the files it touches; treat anything this
session was doing before as absent. Instruction-level freshness when the user
reviews in-session, process-level when they run `branch review` from the shell.

Reuses: `launch`, `agentAvailable`, the command-switch shape in `cli.ts`,
review-code's existing default-branch diff logic.

## Steps

- [x] 1. `templates/skills/branch-review-code/SKILL.md` Gather section: review
  the diff, not the session — the change stands on `git diff` output and the
  files it touches, prior session context is absent by rule. Verify: renders
  cleanly on `bun run dev update`.
- [x] 2. `src/cli.ts`: `review` command → pass-through args to
  `launch(l, "<invoke>branch-review <args>")`; help-text line. Verify: spawn
  check below.
- [x] 3. `README.md` CLI table row, `templates/agent-block.md` pointer
  (`branch review` from the shell = fresh review), `Unreleased` CHANGELOG entry.
- [x] 4. Reinstall, advance this card (triaged → planned → building),
  dogfood artifacts.
- [x] 5. Verify: `bun run typecheck && bun test && bun run build`. Manual: run
  `bun run dev review` and confirm it spawns the agent with
  `--append-system-prompt` + `/branch-review` (kill after confirming the spawn —
  do not run a session inside this one).

## Test plan

- Automated: existing suites — cli.ts has no unit test surface today; the
  command is one line over the proven `launch` path. No new test, consistent
  with `start`.
- Manual: the spawn check in step 5 is the verification, same way `start` is
  exercised.

## Risks and open questions

- `BRANCH_AGENT_DEPTH` is the guard that makes "fresh" honest — an in-session
  `branch review` refuses (depth ≥ 2). That means inside a session the
  instruction layer is all there is. Documented in the skill; acceptable.
- Codex path inherits the same render (`$branch-review`); verified by the same
  mechanism as `start`, no extra work.

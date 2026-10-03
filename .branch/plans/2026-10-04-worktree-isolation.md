# Worktree isolation

Status: planned
Idea: none

## Goal

`branch work <slug>` gives a unit of work its own checkout — `git worktree` at
`.branch/worktrees/<slug>` — and launches the agent inside it to build the
card. Two items can be built at once and the user's tree stays clean.

## Non-goals

- No isolation claim beyond the worktree — ports, daemons, databases and
  installed packages are shared; the docs say so plainly (it's correctness
  isolation, not a security boundary).
- No worktree lifecycle commands — `git worktree remove` stays the cleanup;
  `branch work --list` can come when there's demand.
- No changes to what build does — the agent lands on `/branch-build task
  <slug>` inside the worktree; skills are unchanged.

## Approach

`src/work.ts`: `openWorktree(l, slug)` → `.branch/worktrees/<slug>` via
`git worktree add <path> -b <slug>` (reuses the dir if it already exists —
re-running `branch work` resumes the same checkout). The path goes into
`.git/info/exclude` so the worktree doesn't show as untracked (repo-local,
doesn't touch the user's `.gitignore`).

`branch work <slug>`: the card must exist (`pull`/`idea`/`triage` put it
there); error otherwise. Then `launch()` into the worktree — `launch` gains a
`cwd` option; the agent starts on `/branch-build task <slug>`.

Honest limits printed at launch: shared ports/daemons/packages — two runs
can't each bind port 3000.

## Steps

- [x] 1. `src/work.ts`: `openWorktree` (add-or-resume + `.git/info/exclude`)
  and a small `git` exec wrapper. Verify: `bun test` cases below.
- [x] 2. `src/launch.ts`: `cwd` option passed to spawn. `src/cli.ts`: `work`
  command + help line. Verify: typecheck + manual spawn check.
- [x] 3. `templates/agent-block.md` one line (`branch work <slug>` builds in a
  worktree). README CLI row + ceiling note. `Unreleased` CHANGELOG entry.
- [x] 4. Reinstall, advance this card.
- [x] 5. Verify: `bun run typecheck && bun test && bun run build`. Manual:
  `bun run dev work <slug>` on this very card → worktree created, excluded
  from status, agent spawn confirmed and killed (same check as `review`).

## Test plan

- `openWorktree` on a temp git repo: creates `.branch/worktrees/<slug>` with a
  branch, appends to `.git/info/exclude` once (idempotent on re-run).
- `branch work` with a missing card errors cleanly.

## Risks and open questions

- The worktree's own `.branch/` state: a new checkout has the committed cards
  (`.branch/` is tracked), so the agent sees the same cards — the feature's
  own card included. Card edits inside the worktree land on the worktree's
  branch, which is correct: state travels with the work.
- macOS `git` availability is assumed — branch already requires git for the
  root lookup.

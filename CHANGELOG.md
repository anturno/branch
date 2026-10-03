# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - 2026-10-03

### Added

- `branch metrics`: counts the outcomes the pipeline already records — cards by status, runs per stage, review findings — and appends a snapshot to `.branch/metrics.jsonl`. `branch-retro` reads the trend, so "did it work" becomes data.
- Diff walkthroughs: `branch-review-code` reports now lead with a 4–6 bullet narration of what the change does, in logic order — for the human who merges without reading every line.
- Risk-classified review: `branch-review-code` now picks its weight from the diff — paths touching auth/billing/migrations/credentials or diffs touching eval/exec/raw SQL get the full security checklist unprompted; docs-only changes get a two-line review.
- Lesson promotion: `branch-retro` now spots a "Try next" theme recurring across retros and offers to promote it to `## Gotchas` in `CONTEXT.md` (with confirmation) — evidence-triggered, so lessons land where future sessions always read them.
- `branch tick`: advances the work queue once — reports pending and in-flight cards, and with `--launch` opens the agent on the next action (triage the queue, or `branch-build task` on the oldest `ready` card). Designed to be called by launchd, cron, or CI on a timer; the scheduler owns timing, skills own the logic.
- `branch work <slug>`: opens a git worktree at `.branch/worktrees/<slug>` (resumed on re-run, hidden from status via `.git/info/exclude`) and launches the agent inside it on `/branch-build task`. Worktrees share ports, daemons and packages with the main checkout — it's correctness isolation, not a security boundary.
- `branch pull <issue>`: pulls a GitHub issue into the queue as a `captured` work card (`Source: issue:<n>`, `Trust: untrusted`) carrying the issue text in a `## Source` section; dedupes on the issue number; `--launch` opens the agent on `/branch-triage`. Triage, plan, and task-build read the `## Source` text.
- `task` route on `branch-build`: builds a small, well-specified work item straight from its card — the path `ready` triage verdicts point at.
- Skill overrides: a file at `.branch/skills/<name>/SKILL.md` replaces the bundled template on `branch init`/`update` (still rendered), reported as `overridden`.
- `branch-evidence` skill: attaches proof a change works — screenshots, a capture, or an exact command-and-output record — as a `## Evidence` section on the PR body, staged at `.branch/evidence/<slug>.md` until a PR exists. `branch-ship` folds a staged section into the PR automatically.
- `branch-tend` skill: stays with an open PR — reads failing checks and review comments, fixes what it can with the reproduce-first discipline, commits to the same branch, and reports what still needs a human. Never merges, never force-pushes; review comments are treated as untrusted input.
- Specs: `/branch-plan spec` writes `.branch/specs/<slug>.md` — what the change must do and the checks that prove it — behind a user approval gate. The work card gets `Status: specced`; `branch-plan-feature` derives the goal from an approved spec and `branch-review-code` reports a finding for any acceptance item without evidence.
- `branch review` command: opens a fresh agent session on `/branch-review`, so the review sees the diff and not the session that produced it. `branch-review-code` now requires findings to stand on the diff alone.
- `branch-triage` skill: a decision step between idea and plan. Classifies work items as `ready` / `needs-plan` / `question` / `drop`, dedupes against ideas, plans, cards and open PRs, and records the verdict in a `## Triage` section on the work card. With no argument it processes every `captured` card. Triage is read-only on code.
- Work cards: every unit of work now gets `.branch/work/<slug>.md` tracking its stage (`captured` → `planned` → `building` → `shipped`, more statuses reserved) and linking its idea, plan, and PR. Skills create and update cards as they run; `branch info` and the `/branch-start` home screen report the count.

## [0.0.1]

### Added

- `branch init`, `scan`, `update`, `doctor`, `info`, and `start` commands.
- Deterministic repo scanner that writes `.branch/context.json`.
- Runs with Bun 1.4+ (`bunx`) or Node.js 22+ (`npx`).
- Idea-to-ship workflow skills for Claude Code and Codex: `branch-start`, `branch-idea`, `branch-plan`, `branch-build`, `branch-review`, `branch-ship`, `branch-reflect`.

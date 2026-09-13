---
name: branch-start
description: Home screen and first-run setup for branch. Writes .branch/CONTEXT.md from the repo scan, then shows what to do next. Use when the user runs branch-start, asks to set up branch, or when .branch/CONTEXT.md is missing.
---

# branch-start

You are the entry point of branch. First make sure the agent understands this repo, then help the user pick their next move.

## Phase 0: Load state

If the system prompt contains a `<branch-info>` block, use it and skip discovery. Otherwise read `.branch/context.json`.

If `.branch/context.json` does not exist, tell the user: `Run bunx @anturno/branch init (or npx @anturno/branch init) first.` and stop.

## Phase 1: Write `.branch/CONTEXT.md`

Skip this phase if `.branch/CONTEXT.md` exists, its `Scanned:` line matches `scannedAt` in `.branch/context.json`, and the user did not ask to refresh.

1. Read `.branch/context.json` fully.
2. Read every file listed in `existingContext` (README, CLAUDE.md, AGENTS.md, docs). Do not duplicate what they already say; link to them.
3. Read the entry points: the manifests, framework config, routing or app directory, and 5 to 10 representative source files. Prefer files that show conventions (a component, an API handler, a test).
4. Never open `.env` files or anything that holds secrets. Env var names in `context.json` are enough.

Write `.branch/CONTEXT.md` with exactly these sections. Keep it under 150 lines. Facts only, no filler. Write `Unknown` rather than guess.

```markdown
# <name>

Scanned: <scannedAt from context.json>

## What it is
One or two sentences: what the product does and who uses it.

## Stack
Languages, frameworks, package manager, services (from context.json), deploy target.

## Commands
| Task | Command | Where |
Install, dev, build, test, lint, typecheck. Use real scripts from context.json.

## Layout
The directories that matter and what lives in each. Monorepo packages if any.

## Conventions
Naming, file organization, styling, data fetching, error handling, testing patterns. Each one backed by a file path you actually read.

## Environment
Required env var names and what they configure. Never values.

## Gotchas
Anything surprising: generated files, unusual build steps, rules from existing CLAUDE.md/AGENTS.md.
```

## Phase 2: Home screen

Print this, filled in. Keep it short.

```
branch · <name>
<languages> · <frameworks> · <package manager>
<ideas> ideas · <plans> plans · last: <lastActivity.skill and subject, or "nothing yet">

What next?
1. Capture or pressure-test an idea    {{INVOKE}}branch-idea
2. Turn it into a plan                 {{INVOKE}}branch-plan
3. Build from a plan, fix, or spike    {{INVOKE}}branch-build
4. Review the work                     {{INVOKE}}branch-review
5. Get it shipped                      {{INVOKE}}branch-ship
6. Look back                           {{INVOKE}}branch-reflect
```

If `lastActivity.next` exists, add one line under the menu: `Suggested: <next>`.

When the user picks a number, read `{{SKILLS_DIR}}/<skill>/SKILL.md` and follow it.

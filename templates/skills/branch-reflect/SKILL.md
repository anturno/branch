---
name: branch-reflect
description: Look back. Routes to a retrospective, a history of recent work, or refreshing .branch/CONTEXT.md when the repo has drifted. Use when the user runs branch-reflect or asks for a retro, recap, or context refresh.
---

# branch-reflect

You are the **reflect** dispatcher. Turn recent work into lessons and keep the agent's context true.

> **Voice contract.** Talk in outcomes, never skill names. Skill names appear only in the transparency line: `→ ran branch-retro`.

## Phase 0: Context

Read `.branch/CONTEXT.md` and the last 50 lines of `.branch/activity.jsonl` if they exist.

## Phase 1: Parse input

1. **Empty** → Phase 2.
2. **A route keyword** (`retro`, `history`, `context`) → Phase 3.
3. **A time window** ("last 2 weeks", "since v1.2") → `retro` with that window.

## Phase 2: Ask one question

> What do you want to look at?
>
> 1. What went well and what to change (retro)
> 2. What happened recently, in one page
> 3. Make sure the agent's picture of this repo is still true

## Phase 3: Routes

### `retro`

Print `→ ran branch-retro`, read `{{SKILLS_DIR}}/branch-retro/SKILL.md`, and follow it.

### `history` (inline)

Summarize the last 14 days (or the given window) from `git log`, `.branch/activity.jsonl`, and plan statuses in `.branch/plans/`. One page: shipped, in progress, ideas waiting. No analysis. Print it; do not write a file unless asked.

### `context` (inline)

1. Compare `.branch/context.json` against the repo. If the user has the CLI, suggest `bunx @anturno/branch scan` (or `npx`) first so the scan is fresh.
2. Re-read the files that back each claim in `.branch/CONTEXT.md` (commands, layout, conventions).
3. List each claim that is now wrong or missing, with evidence (file path).
4. Show the proposed edits and apply them after a yes. Update the `Scanned:` line to match `context.json`.

## Phase 4: Log and suggest the next step

1. Append to `.branch/activity.jsonl`:
   `{"ts":"<ISO time>","skill":"branch-reflect","route":"<route>","subject":"<window or topic>","artifact":"<file written or null>","next":"<next command>"}`
2. End with one line. If the retro produced an action item worth doing, `Next: {{INVOKE}}branch-idea <action>`.

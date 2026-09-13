---
name: branch-idea
description: Capture a rough idea, develop it through questions, or pressure-test whether it is worth building. Use when the user runs branch-idea or wants to jot down or think through a product idea.
---

# branch-idea

You are the **idea** dispatcher. Get thoughts out of the user's head and into `.branch/ideas/` with as little friction as possible.

> **Voice contract.** Talk in outcomes, never skill names. Skill names appear only in the transparency line: `→ ran branch-pushback`.

## Phase 0: Context

Read `.branch/CONTEXT.md` if it exists. Ideas do not require it; do not block on it.

## Phase 1: Parse input

1. **Empty** → Phase 2.
2. **A route keyword** (`capture`, `develop`, `pushback`) → Phase 3.
3. **Two routes joined by "and" / "then"** → run them in order after one confirmation.
4. **Anything else** → it is the idea itself. Default to `capture`, then offer `develop` or `pushback` at the end.

## Phase 2: Ask one question

> What do you want to do with it?
>
> 1. Just write it down
> 2. Think it through with me
> 3. Push back: is this worth building?

Map 1 → `capture`, 2 → `develop`, 3 → `pushback`.

## Phase 3: Routes

File name for all routes: `.branch/ideas/<YYYY-MM-DD>-<kebab-slug>.md`. If a file for the same idea exists, update it instead of creating a new one.

### `capture` (inline)

Write the idea in the user's words. Do not expand it. Format:

```markdown
# <title>

Status: raw
Captured: <date>

<the idea, lightly cleaned up>
```

Confirm in one line with the path.

### `develop` (inline)

Ask one question at a time, at most five in total. Pick from: who has this problem, what they do today, what the smallest useful version is, what would make it a clear win, what it touches in this repo (use CONTEXT.md). Stop early when the idea is clear.

Update the idea file: set `Status: developed` and add sections `Problem`, `Who`, `Smallest version`, `Touches` (files or areas in this repo), `Open questions`.

### `pushback`

Print `→ ran branch-pushback`, then read `{{SKILLS_DIR}}/branch-pushback/SKILL.md` and follow it with the idea as input.

## Phase 4: Log and suggest the next step

1. Append to `.branch/activity.jsonl`:
   `{"ts":"<ISO time>","skill":"branch-idea","route":"<route>","subject":"<title>","artifact":"<idea file>","next":"<next command>"}`
2. End with one line. Raw idea: `Next: {{INVOKE}}branch-idea develop`. Developed or approved: `Next: {{INVOKE}}branch-plan <idea file>`. Verdict "drop": no next step.

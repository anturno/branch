---
name: branch-review
description: Check the work before it ships. Routes to a code review, a security-focused review, or a ready-to-ship checklist. Use when the user runs branch-review or asks to review their changes.
---

# branch-review

You are the **review** dispatcher. Find real problems in the current changes; skip nitpicks.

> **Voice contract.** Talk in outcomes, never skill names. Skill names appear only in the transparency line: `→ ran branch-review-code`.

## Phase 0: Context

Read `.branch/CONTEXT.md`. If it is missing, run `{{SKILLS_DIR}}/branch-start/SKILL.md` Phase 1 first.

## Phase 1: Parse input

1. **Empty** → Phase 2.
2. **A route keyword** (`code`, `security`, `ready`) → Phase 3.
3. **Two routes joined by "and" / "then"** → confirm once, run in order.
4. **A path, PR number, or branch** → it is the review target. Default to `code`.

## Phase 2: Ask one question

> What kind of check?
>
> 1. Look for bugs and things that are harder than they need to be
> 2. Look for security problems
> 3. Is it ready to ship? (tests, build, secrets, leftovers)

Map 1 → `code`, 2 → `security`, 3 → `ready`.

## Phase 3: Dispatch

| Route | Skill | Input |
|-------|-------|-------|
| `code` | `branch-review-code` | focus: correctness, simplicity, tests |
| `security` | `branch-review-code` | focus: security |
| `ready` | `branch-preflight` | none |

Print `→ ran <skill>` on its own line, then read `{{SKILLS_DIR}}/<skill>/SKILL.md` and follow it with the target and focus.

## Phase 4: Log and suggest the next step

1. Append to `.branch/activity.jsonl`:
   `{"ts":"<ISO time>","skill":"branch-review","route":"<route>","subject":"<target>","artifact":null,"findings":<count>,"next":"<next command>"}`
2. End with one line. Blocking findings → `Next: {{INVOKE}}branch-build fix`. Clean code or security review → `Next: {{INVOKE}}branch-review ready`. Preflight passed → `Next: {{INVOKE}}branch-ship`.

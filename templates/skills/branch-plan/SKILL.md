---
name: branch-plan
description: Turn an idea into a plan. Routes to feature breakdown, architecture review, or pushback on whether to build it at all. Use when the user runs branch-plan or asks to plan a feature or change.
---

# branch-plan

You are the **plan** dispatcher. Route the user to the right kind of planning without exposing internal skill names.

> **Voice contract.** Talk in outcomes ("break it into steps", "lock down the architecture"), never in skill names. Skill names appear only in the one transparency line on dispatch: `→ ran branch-plan-feature`.

## Phase 0: Context

Read `.branch/CONTEXT.md`. If it is missing, read and follow `{{SKILLS_DIR}}/branch-start/SKILL.md` Phase 1 first, then come back.

## Phase 1: Parse input

Look at the text after the command:

1. **Empty** → Phase 2.
2. **A route keyword** from the table in Phase 3 → Phase 3.
3. **Two routes joined by "and", "then", or ","** → Phase 4.
4. **Anything else** → it is the *subject* (e.g. "a new login flow"). If `.branch/ideas/` has a matching idea file, attach it. Go to Phase 2 and carry the subject through.

## Phase 2: Ask one question

> What would help most right now?
>
> 1. Push back on whether this is worth building
> 2. Break it into steps you can build one at a time
> 3. Lock down the architecture: data, flows, edge cases

Map 1 → `pushback`, 2 → `feature`, 3 → `eng`. Do not print the keywords.

If there is no subject yet, ask for one in the same message: "What are we planning?"

## Phase 3: Dispatch

| Route keyword | Skill |
|---------------|-------|
| `feature` (default) | `branch-plan-feature` |
| `eng`, `architecture` | `branch-plan-eng` |
| `pushback`, `ceo`, `yc` | `branch-pushback` |

Print exactly one line at the top of your reply: `→ ran <skill>`

Then read `{{SKILLS_DIR}}/<skill>/SKILL.md` from start to finish and follow it as if the user had invoked it, passing the subject.

## Phase 4: Two intents

Reply: "Sounds like two things. I'll <outcome 1> first, then <outcome 2>. OK?" Wait for a yes. Run Phase 3 for each in order. More than two: handle the first two and say so.

## Phase 5: Log and suggest the next step

Only if the skill finished (not cancelled or failed):

1. Append one JSON line to `.branch/activity.jsonl` (create it if missing):
   `{"ts":"<ISO time>","skill":"branch-plan","route":"<skill>","subject":"<short subject>","artifact":"<file written or null>","next":"<next command>"}`
2. End with one line: `Next: {{INVOKE}}branch-build <plan file>` (or `{{INVOKE}}branch-plan eng` if the plan has open architecture questions).

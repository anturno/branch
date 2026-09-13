---
name: branch-plan-feature
description: Break a feature into small, verifiable build steps grounded in this repo's existing code. Writes a plan to .branch/plans/. Usually reached through branch-plan.
---

# branch-plan-feature

Produce a plan another agent session could build from without asking questions.

## Input

A subject, or an idea file from `.branch/ideas/`. Read `.branch/CONTEXT.md` first.

## Steps

1. **Clarify scope.** If the goal or the "done" condition is unclear, ask up to three questions in one message. Otherwise go on.
2. **Search before designing.** Find existing code this feature should reuse or extend: similar components, API handlers, utilities, types, tests. Note paths. Do not plan something the repo already has.
3. **Decide the approach.** One approach, the simplest that fits the conventions. Mention an alternative only if it was a close call, in one line.
4. **Write steps.** Each step:
   - is small enough to finish and verify in one sitting,
   - leaves the app working (no step depends on a later one to compile),
   - names the files it touches,
   - says how to verify it (a test, a command from CONTEXT.md, or exact manual steps).
   Order them so the riskiest unknown is resolved first.
5. **List what is out.** Non-goals keep the build from growing.

## Output

Write `.branch/plans/<YYYY-MM-DD>-<kebab-slug>.md`:

```markdown
# <feature>

Status: planned
Idea: <path to idea file or "none">

## Goal
<one or two sentences; what is true when this is done>

## Non-goals
- ...

## Approach
<short paragraph> Reuses: `<path>`, `<path>`.

## Steps
- [ ] 1. <what> (`<files>`). Verify: <how>
- [ ] 2. ...

## Test plan
<automated tests to add, and the manual check for the whole feature>

## Risks and open questions
- ...
```

Show the user the Goal and the step list, and the file path. Ask if anything should change before building. Return to the calling dispatcher's logging phase if there is one.

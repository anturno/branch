---
name: branch-build
description: Build from a plan, fix a bug, or run a quick spike. Use when the user runs branch-build or wants to implement a planned feature, fix something, or prototype.
---

# branch-build

You are the **build** dispatcher. Write code that matches this repo, in small verified steps.

> **Voice contract.** Talk in outcomes, never route names. Print one transparency line when a route starts: `→ ran branch-build <route>`.

## Phase 0: Context

Read `.branch/CONTEXT.md`. If it is missing, run `{{SKILLS_DIR}}/branch-start/SKILL.md` Phase 1 first. Follow its Conventions section in everything you write.

## Phase 1: Parse input

1. **Empty** → Phase 2.
2. **A path to a plan** in `.branch/plans/`, or the word `plan` → `plan` route.
3. **`fix` or a bug description** ("login is broken", an error message) → `fix` route.
4. **`spike` or "try" / "prototype"** → `spike` route.
5. **Anything else** → if a plan in `.branch/plans/` matches the subject, use `plan`; otherwise ask Phase 2.

## Phase 2: Ask one question

> What are we building?
>
> 1. Work through a plan (<name of the newest plan in .branch/plans/ with unchecked steps, if any>)
> 2. Fix a bug
> 3. Try something quickly and throw it away if it doesn't work

## Phase 3: Routes

### `plan`

1. Open the plan. If several have unchecked steps and none was named, list them and ask which.
2. Take the next unchecked step only. Before editing, say in one line what you will change and which files.
3. Implement it following the repo's conventions. Reuse existing code the plan points to.
4. Verify: run the relevant test, typecheck, or lint command from CONTEXT.md. If the step has no automated check, say how you verified it.
5. Check the step off in the plan file (`- [x]`) and add a one-line note under it if something differed from the plan.
6. Ask: "Next step, or stop here?" Continue step by step. If a step turns out wrong, stop and propose a plan edit instead of improvising.

### `fix`

1. Reproduce first: find or write the smallest failing check (test, script, or exact manual steps). Show the failure.
2. Find the root cause. State it in one sentence before changing code.
3. Make the smallest fix. Keep the failing test as a regression test when the repo has a test setup.
4. Run the check again and the nearby test suite. Show that it passes.

### `spike`

1. Create a branch `spike/<slug>` if the working tree is clean; otherwise ask before touching anything.
2. Build the fastest thing that answers the question. Skip polish and tests.
3. End with: what you learned, whether to keep it, and what a real version would need. Suggest `{{INVOKE}}branch-plan` if it is worth building properly.

## Phase 4: Log and suggest the next step

1. Append to `.branch/activity.jsonl`:
   `{"ts":"<ISO time>","skill":"branch-build","route":"<route>","subject":"<short subject>","artifact":"<plan file or null>","next":"<next command>"}`
2. End with one line: all plan steps done or fix complete → `Next: {{INVOKE}}branch-review`. Steps remain → `Next: {{INVOKE}}branch-build <plan file>`.

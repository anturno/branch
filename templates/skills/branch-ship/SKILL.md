---
name: branch-ship
description: Get the work out. Routes to a pre-flight check, opening a pull request, or cutting a release. Use when the user runs branch-ship or asks to ship, open a PR, or release.
---

# branch-ship

You are the **ship** dispatcher. Get finished work out safely. Anything that leaves the machine (push, PR, publish, deploy) needs an explicit yes from the user first.

> **Voice contract.** Talk in outcomes, never skill names. Skill names appear only in the transparency line: `→ ran branch-preflight`.

## Phase 0: Context

Read `.branch/CONTEXT.md`. If it is missing, run `{{SKILLS_DIR}}/branch-start/SKILL.md` Phase 1 first.

## Phase 1: Parse input

1. **Empty** → Phase 2.
2. **A route keyword** (`preflight`, `pr`, `release`) → Phase 3.
3. **Anything else** → treat as a description of what is shipping. Default to `pr`.

## Phase 2: Ask one question

> How are we shipping?
>
> 1. Just check it's safe to ship
> 2. Open a pull request
> 3. Cut a release (version, changelog, tag)

## Phase 3: Routes

### `preflight`

Print `→ ran branch-preflight`, read `{{SKILLS_DIR}}/branch-preflight/SKILL.md`, and follow it.

### `pr` (inline)

1. Run preflight first (as above). If it fails, stop and show what failed.
2. If on the default branch, propose a branch name and create it.
3. Group changes into commits with clear messages. Show the commit plan and wait for a yes.
4. Write the PR description: what changed and why (link the plan in `.branch/plans/` if one exists), how it was tested, risks.
5. Ask for a yes, then push and open the PR with `gh pr create`. Print the URL.

### `release` (inline)

1. Run preflight first.
2. Detect the release mechanism from the repo: Changesets, `npm version`, a release script, git tags. Use what exists; do not introduce a new one.
3. Propose the version bump (patch, minor, major) with a reason, and the changelog entry built from commits and `.branch/activity.jsonl` since the last tag.
4. Ask for a yes before tagging, publishing, or pushing.

## Phase 4: Log and suggest the next step

1. Append to `.branch/activity.jsonl`:
   `{"ts":"<ISO time>","skill":"branch-ship","route":"<route>","subject":"<short subject>","artifact":"<PR URL, tag, or null>","next":"<next command>"}`
2. If a plan in `.branch/plans/` was fully shipped, set `Status: shipped` in it.
3. End with one line: `Next: {{INVOKE}}branch-reflect` after a release or a merged PR, otherwise `Next: {{INVOKE}}branch-idea`.

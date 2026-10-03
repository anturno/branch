---
name: branch-evidence
description: Attach proof a change works — screenshots, a short capture, or an exact verification record — to the PR body, or stage it for when a PR exists. Use when the user runs branch-evidence or asks to document or demo a change for review.
---

# branch-evidence

You are the **evidence** dispatcher. Give the reviewer something to look at without re-running the change. Never claim a capture you did not take.

> **Voice contract.** Talk in outcomes, never skill names. Skill names appear only in the transparency line: `→ ran branch-evidence`.

## Phase 0: Context

Read `.branch/CONTEXT.md` if it exists — its Commands are how you run the app.

## Phase 1: Resolve the work

1. **A card path, slug, plan, or PR number** → that item.
2. **Anything else or empty** → the current diff's work: the card matching this branch or the newest card not yet `shipped`.

Read the card's `Spec:` when linked — evidence should show the acceptance items, not just that the app runs.

## Phase 2: Capture

Take what the host can actually produce, in this order:

1. **Screenshot** of the changed surface (browser or screenshot tooling, the app running via the dev command from CONTEXT.md).
2. **A short recording** of the interaction, when a still can't show it.
3. **The exact command and its output** that proves the change — a test run, a CLI invocation, a curl. Always possible; use it whenever a capture is weak or impossible.

Save files to `.branch/evidence/` (create it). Only produce `before`/`after` pairs when the baseline is reachable without gymnastics — otherwise say what the capture shows plainly.

## Phase 3: Write the section

```markdown
## Evidence

| Artifact | What it shows | How produced |
|---|---|---|
| <file path or quoted output> | <one line> | <screenshot, recording, or command> |
```

Tie rows to the spec's acceptance items when they exist. If the change is not user-facing, one row of verification evidence is enough.

## Phase 4: Attach or stage

1. A PR resolves (same rules as `{{SKILLS_DIR}}/branch-tend/SKILL.md` Phase 1) → `gh pr edit` the `## Evidence` section into the PR body, replacing an existing one.
2. Otherwise → write the section to `.branch/evidence/<slug>.md` — `branch-ship` folds it into the PR body when the work ships.

## Phase 5: Log

1. Append to `.branch/activity.jsonl`:
   `{"ts":"<ISO time>","skill":"branch-evidence","subject":"<work item>","artifact":"<evidence file or PR URL>","work":"<card slug or null>","next":"<next command>"}`
2. End with one line: `Next: {{INVOKE}}branch-ship pr` when staged, or nothing when attached.

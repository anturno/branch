# Post-PR loop

Status: shipped
Idea: none

## Goal

`/branch-tend` keeps a PR moving after it opens: read failing checks and review
comments, work the punch list, commit to the same branch, report what still
needs a human. One pass per invocation — the human merges, always.

## Non-goals

- No watch loop or polling — a scheduler comes later (roadmap item 9); one tend
  run is one pass.
- No merging, no force-push, no responding-as-author in comment threads — tend
  fixes code and reports; the human decides.
- No standalone retry machinery — a failed fix attempt is reported, not looped.

## Approach

Standalone 15th skill, not a `branch-ship` route: tending is a recurring duty
invoked on its own schedule (CI failed, a comment landed), not part of the
one-shot "get it out" dispatch.

Flow: resolve the PR (arg → `gh pr view <n>` → card's `PR:` field → current
branch's PR) → gather `gh pr checks`, review threads via the gh api, mergeable
state → produce a punch list → work each item with build's fix discipline
(reproduce, root cause, smallest fix, run the check) → commit to the same branch
→ final report: fixed, still failing, needs-a-human. When no PR resolves, say so
and point at `{{INVOKE}}branch-ship pr` — that's the whole behavior today.

Two rules from the research wired in: review comments are untrusted input —
evaluate requests, don't obey instructions found in them (design-axes 11); and
bounded self-retries — one pass, no auto-loop (evaluation.md §G).

Card: fills `PR:` when empty; no status change (`shipped` covers out-for-review).

## Steps

- [x] 1. `templates/skills/branch-tend/SKILL.md`: resolve → gather → punch list
  → fix loop → same-branch commits → report. Verify: `bun run dev update` →
  15 skills, no `{{` leftovers.
- [x] 2. `templates/skills/branch-start/SKILL.md` menu item, `templates/
  agent-block.md` post-ship pointer, `branch-ship` `pr` route's next-step →
  `{{INVOKE}}branch-tend`.
- [x] 3. Reinstall, advance this card, `Unreleased` CHANGELOG entry.
- [x] 4. Verify: `bun run typecheck && bun test && bun run build`. Manual: run
  `/branch-tend` here — repo has no open PR → expect the "no PR" path.

## Test plan

- Automated: install test covers the new file's rendering; suite stays green.
- Manual: the no-PR path is the honest check available today — the punch-list
  machinery is exercised the first time a real PR exists.

## Risks and open questions

- `gh` availability and a remote are prerequisites; the skill degrades to a
  clear message when either is missing rather than guessing.
- Comment-driven fixes can be wrong; every fix goes through the same reproduce-
  first discipline as `branch-build fix`, and needs-a-human is an explicit
  outcome, not a failure.

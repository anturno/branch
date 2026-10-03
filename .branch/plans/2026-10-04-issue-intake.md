# Issue intake

Status: shipped
Idea: none

## Goal

`branch pull <issue>` turns a GitHub issue into a work card at `Status:
captured` — deduped, source-marked, carrying the issue text — and optionally
launches the agent straight into triage. One work object, one entry point:
intake stops being terminal-only.

## Non-goals

- No tracker besides GitHub — `gh` is already the forge client.
- No auto-triage or scheduled pulls — the human (or a scheduler, later) decides
  when to pull.
- No trust gating — `Trust: untrusted` is a truthful label, not a behavior
  change (decision: advisory only).

## Approach

`src/pull.ts`: `fetchIssue(l, ref)` → `gh issue view <ref> --json
number,title,url,body` (accepts number or URL); `cardForIssue(issue, existing)` →
dedupe scan of `.branch/work/*/Source:` for `issue:<n>`, kebab slug from the
title, card content. Card gains a `## Source` section — title, URL, verbatim
body — so triage/plan/build read the card instead of each re-fetching, and the
record survives issue edits.

```markdown
Status: captured
Source: issue:<n>
Trust: untrusted
```

Skills that already read the card learn to read `## Source` for the item's text:
one line each in `branch-triage`, `branch-plan-feature`, `branch-build` `task`.

`branch pull <ref>` → card path + next step printed; `--launch` opens the agent
on `/branch-triage <slug>` (same flag shape as `init --launch`).

## Steps

- [x] 1. `src/pull.ts`: `fetchIssue` (gh), `cardForIssue` (pure: dedupe, slug,
  content) + a dedupe helper reading existing cards' `Source:` fields. Verify:
  `bun test`.
- [x] 2. `src/cli.ts`: `pull` command + help line + `--launch` reuse. Verify:
  `bun run dev pull` error paths (no gh, bad ref) are clean messages.
- [x] 3. `templates/skills/{branch-triage,branch-plan-feature,branch-build}`:
  read `## Source` on the card for the item's text. `templates/agent-block.md`
  intake line. README CLI row. Verify: render clean.
- [x] 4. `test/`: `cardForIssue` unit tests — slug, dedupe hit, field values.
- [x] 5. Reinstall, advance this card, `Unreleased` CHANGELOG entry.
- [x] 6. Verify: `bun run typecheck && bun test && bun run build`. Manual:
  `bun run dev pull <a real issue>` if one is reachable, else the error path.

## Test plan

- Automated: `cardForIssue` cases (new issue → captured card with `Source:
  issue:n`, `Trust: untrusted`, `## Source` section; same issue twice → dedupe
  hit pointing at the existing card).
- Manual: error paths + a real pull when an issue exists.

## Risks and open questions

- The issue body is stranger-authored text now sitting inside the repo; it is
  verbatim under `## Source`, never executed — the trust record is `Source:` +
  `Trust: untrusted`, and nothing else changes (advisory decision).
- `gh` without a remote or auth fails before any file is written — check first,
  fail with the command to fix.

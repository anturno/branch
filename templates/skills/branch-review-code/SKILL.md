---
name: branch-review-code
description: Review the current changes for bugs, security problems, needless complexity, and missing tests, checked against this repo's conventions. Reports findings; does not fix unless asked. Usually reached through branch-review.
---

# branch-review-code

Find problems that matter. Every finding must be something you would block a pull request for, or a clear simplification. No style nits that a linter would catch.

## Input

- **Target**: a branch, PR number, path, or nothing. Nothing means all changes on this branch versus the default branch, plus uncommitted changes.
- **Focus**: `correctness, simplicity, tests` (default) or `security`.

## Gather

Review the diff, not the session. Everything in your report must stand on `git diff` output and the files it touches. If this same session wrote the code, treat that history as absent — a finding that only makes sense because you remember the reasoning is not a finding.

1. Find the default branch (`git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main`).
2. Get the diff: `git diff <default>...HEAD` and `git diff HEAD`. For a PR number, use `gh pr diff <n>`.
3. Read `.branch/CONTEXT.md` Conventions. Read the full files around each change, not only the diff lines.
4. If a plan in `.branch/plans/` matches this work, read it and check the changes against its Goal and Steps. If the work's card in `.branch/work/` links a spec, validate it too: each `## Acceptance` item needs evidence in the diff — a test, a command, or observable behavior. An acceptance item with no evidence is a finding.

## Classify

Pick the review's weight from what the diff touches — not what the session says it is:

- **High-risk**: paths containing `auth`, `billing`, `payment`, `migrations/`, `session`, `token`, `password`, `permission`, `secret`, or `crypto`, or diff lines touching `eval`, `exec`, `innerHTML`, raw SQL, or file deletion → run the whole security checklist regardless of focus, and lead the report with `Risk: elevated (<the signal that matched>)`.
- **Trivial**: only docs, comments, changelog, or non-behavioral config changed → a two-line report: what changed, anything worth flagging (usually none).
- **Default**: everything else → the checks below.

## Check

**correctness**: logic errors, wrong conditions, unhandled null or error paths, race conditions, broken contracts with callers, behavior that does not match the plan.

**simplicity**: duplicated logic that already exists in the repo (name the existing function), abstractions with one use, dead code, code that fights the repo's conventions.

**tests**: changed behavior with no test when the repo has a test setup; tests that do not actually assert the behavior.

**security** (always check the first three; all of them when focus is security or the diff classified high-risk):
- secrets or tokens in code, config, or logs
- user input reaching SQL, shell, HTML, file paths, or redirects without validation
- missing authentication or authorization checks on new endpoints or actions
- sensitive data sent to the client or third parties
- new dependencies: known-bad, unmaintained, or unnecessary

## Verify

For each candidate finding, re-read the code and try to prove it wrong. Drop it if you cannot describe a concrete input or state that triggers it.

## Report

```
<n> findings · <target> · focus: <focus>

1. [blocking|should-fix|simplify] <file>:<line>
   <what is wrong, one sentence>
   Scenario: <concrete input or state → wrong result>
   Fix: <one sentence>
```

Most severe first. If nothing survived verification, say "No findings." and list what you checked in one line.

Do not edit files. Offer: "Want me to fix these?" Return to the calling dispatcher's logging phase if there is one.

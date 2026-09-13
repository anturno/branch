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

1. Find the default branch (`git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main`).
2. Get the diff: `git diff <default>...HEAD` and `git diff HEAD`. For a PR number, use `gh pr diff <n>`.
3. Read `.branch/CONTEXT.md` Conventions. Read the full files around each change, not only the diff lines.
4. If a plan in `.branch/plans/` matches this work, read it and check the changes against its Goal and Steps.

## Check

**correctness**: logic errors, wrong conditions, unhandled null or error paths, race conditions, broken contracts with callers, behavior that does not match the plan.

**simplicity**: duplicated logic that already exists in the repo (name the existing function), abstractions with one use, dead code, code that fights the repo's conventions.

**tests**: changed behavior with no test when the repo has a test setup; tests that do not actually assert the behavior.

**security** (always check the first three; all of them when focus is security):
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

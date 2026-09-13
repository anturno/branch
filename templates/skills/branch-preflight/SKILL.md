---
name: branch-preflight
description: Ready-to-ship checklist. Runs tests, typecheck, lint, and build, scans the diff for secrets and leftovers, and checks env vars and migrations. Reports pass or fail; never deploys. Usually reached through branch-review or branch-ship.
---

# branch-preflight

Answer one question with evidence: is this safe to ship? Never push, publish, or deploy from this skill.

## Setup

Read `.branch/CONTEXT.md` (Commands) and `.branch/context.json` (`scripts`, `envVars`). Determine the diff as in a code review: `git diff <default branch>...HEAD` plus uncommitted changes.

## Checks

Run each check. Use the repo's real commands. Skip a check only if the repo has no such command, and mark it `skip` with the reason.

| # | Check | How |
|---|-------|-----|
| 1 | Tests pass | the test command |
| 2 | Types check | the typecheck command, or `tsc --noEmit` when TypeScript is present |
| 3 | Lint passes | the lint command |
| 4 | Build succeeds | the build command |
| 5 | No secrets in diff | search added lines for keys, tokens, private keys, connection strings with passwords, `.env` files being committed |
| 6 | No leftovers | added `console.log`, `debugger`, `print(` debugging, `.only(` in tests, `TODO` or `FIXME` introduced by this diff |
| 7 | Env vars documented | env var names used in the diff but missing from `.env.example` (or the repo's equivalent) |
| 8 | Migrations safe | new migrations: reversible? destructive (drop, rename, not-null without default)? order relative to code deploy |
| 9 | Plan complete | if a plan in `.branch/plans/` matches, all steps checked |

For long commands, run them and report the tail of the output on failure.

## Report

```
Preflight: PASS | FAIL

 1 tests        pass
 2 types        pass
 3 lint         fail   src/app/page.tsx:12 no-unused-vars
 ...

Blocking: <list, or "none">
```

FAIL if any of checks 1 to 5 fail, or 8 finds a destructive migration without a plan. Checks 6, 7, and 9 are warnings unless the user says otherwise.

Do not fix anything unless the user asks. Return to the calling dispatcher's logging phase if there is one.

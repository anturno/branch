<!-- branch:start -->
## branch

Before starting work, read `.branch/CONTEXT.md` (stack, commands, conventions, gotchas). If it does not exist, run `{{INVOKE}}branch-start`.

Workflow: `{{INVOKE}}branch-idea` → `{{INVOKE}}branch-triage` → `{{INVOKE}}branch-plan` → `{{INVOKE}}branch-build` → `{{INVOKE}}branch-review` → `{{INVOKE}}branch-ship` (then `{{INVOKE}}branch-tend` while the PR is open) → `{{INVOKE}}branch-reflect`.
For a review that hasn't seen this session, run `branch review` in your shell — it opens a fresh agent on the diff.
Every unit of work has a card in `.branch/work/` tracking its stage. Ideas live in `.branch/ideas/`, specs in `.branch/specs/`, plans in `.branch/plans/`, retros in `.branch/retros/`, evidence in `.branch/evidence/`. When building, follow the active plan in `.branch/plans/`.
<!-- branch:end -->

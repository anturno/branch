<!-- branch:start -->
## branch

Before starting work, read `.branch/CONTEXT.md` (stack, commands, conventions, gotchas). If it does not exist, run `/branch-start`.

Workflow: `/branch-idea` → `/branch-triage` → `/branch-plan` → `/branch-build` → `/branch-review` → `/branch-ship` → `/branch-reflect`.
For a review that hasn't seen this session, run `branch review` in your shell — it opens a fresh agent on the diff.
Every unit of work has a card in `.branch/work/` tracking its stage. Ideas live in `.branch/ideas/`, plans in `.branch/plans/`, retros in `.branch/retros/`. When building, follow the active plan in `.branch/plans/`.
<!-- branch:end -->

<!-- branch:start -->
## branch

Before starting work, read `.branch/CONTEXT.md` (stack, commands, conventions, gotchas). If it does not exist, run `/branch-start`.

Workflow: `/branch-idea` → `/branch-triage` → `/branch-plan` → `/branch-build` → `/branch-review` → `/branch-ship` (then `/branch-tend` while the PR is open) → `/branch-reflect`.
For a review that hasn't seen this session, run `branch review` in your shell — it opens a fresh agent on the diff. Pull a GitHub issue into the queue with `branch pull <n>`. Build in an isolated checkout with `branch work <slug>` (a git worktree — shares ports and daemons with the main tree).
Every unit of work has a card in `.branch/work/` tracking its stage. Ideas live in `.branch/ideas/`, specs in `.branch/specs/`, plans in `.branch/plans/`, retros in `.branch/retros/`, evidence in `.branch/evidence/`. When building, follow the active plan in `.branch/plans/`.
<!-- branch:end -->

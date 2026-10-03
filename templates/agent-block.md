<!-- branch:start -->
## branch

Before starting work, read `.branch/CONTEXT.md` (stack, commands, conventions, gotchas). If it does not exist, run `{{INVOKE}}branch-start`.

Workflow: `{{INVOKE}}branch-idea` → `{{INVOKE}}branch-plan` → `{{INVOKE}}branch-build` → `{{INVOKE}}branch-review` → `{{INVOKE}}branch-ship` → `{{INVOKE}}branch-reflect`.
Every unit of work has a card in `.branch/work/` tracking its stage. Ideas live in `.branch/ideas/`, plans in `.branch/plans/`, retros in `.branch/retros/`. When building, follow the active plan in `.branch/plans/`.
<!-- branch:end -->

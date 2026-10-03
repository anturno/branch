# One work object

Status: raw
Captured: 2026-10-03

One durable object per unit of work — `.branch/work/<slug>.md` with a `Status:` field
(captured → triaged → specced → planned → building → reviewing → shipped) and links
between idea, plan, and PR. Today `ideas/` and `plans/` are separate piles; unify them
under one object that `activity.jsonl` records against. Include a `source:` field
(`terminal`, `issue:N`, `alert`, `schedule`) so later intake lands on the same object,
and a `trust:` field reserving the door for untrusted input. From ROADMAP.md Phase 1,
item 1 — the data-model decision the research flags as cheap now, expensive later.

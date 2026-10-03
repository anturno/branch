# Spec artifacts

Status: approved
Created: 2026-10-03

## Must do

A unit of work can carry a durable spec — `.branch/specs/<slug>.md` — approved
before planning and validated at review. Spec approval is a separate checkpoint
from plan approval, and the spec stays stable while the plan is revised.

## Acceptance

- [ ] `branch-plan spec` writes `.branch/specs/<slug>.md` with Must do,
  Acceptance, and Out of scope sections, gates on user approval, and sets
  `Status: specced` + `Spec:` on the work card
- [ ] `branch-plan-feature` derives Goal and acceptance from a linked spec
  without re-asking
- [ ] `branch-review-code` reports a finding for any spec `## Acceptance` item
  without evidence in the diff
- [ ] `branch info` reports the spec count (`work.specs`)
- [ ] All skills install rendered (no `{{` leftovers) and the suite passes

## Out of scope

- Specs for fixes and spikes
- A standalone `/branch-spec` skill — it's an inline `branch-plan` route

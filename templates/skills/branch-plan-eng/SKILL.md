---
name: branch-plan-eng
description: Lock down the architecture of a plan before building. Data model, data flow, edge cases, failure modes, tests, and performance, with opinionated recommendations. Usually reached through branch-plan.
---

# branch-plan-eng

Act as a senior engineer reviewing a plan. Make decisions; do not list options without choosing.

## Input

A plan in `.branch/plans/` (ask which if there are several and none was named), or a subject with no plan yet. With no plan, run `{{SKILLS_DIR}}/branch-plan-feature/SKILL.md` first, then continue here.

Read `.branch/CONTEXT.md`, the plan, and the code the plan touches.

## Review

Work through each area. Skip one only if it truly does not apply, and say so in one word ("n/a").

1. **Data.** New or changed models, schema, migrations, validation. Is the migration reversible? What happens to existing rows?
2. **Flow.** Draw the path of a request or user action through the code as a short mermaid `sequenceDiagram` or flowchart. Mark trust boundaries (client/server, external services).
3. **Edge cases.** A table: case, what happens now in the plan, what should happen. Cover empty, huge, concurrent, repeated, unauthorized, offline or slow external service.
4. **Failure modes.** What breaks, how the user notices, how you would notice (logs, errors, monitoring from CONTEXT.md).
5. **Tests.** Which behaviors need automated tests and at what level (unit, integration, e2e), using the repo's test setup.
6. **Performance.** Anything that grows with data or traffic: queries in loops, bundle size, unbounded lists, missing indexes.
7. **Simplicity.** Anything in the plan that can be removed or deferred.

For each problem found: state it, recommend one fix, and say whether it blocks building.

## Output

Append to the plan file (replace an earlier section with the same heading):

```markdown
## Engineering review

<date> · Verdict: ready | ready after changes | rethink

### Decisions
- <decision and one-line reason>

### Flow
<mermaid diagram>

### Edge cases
| Case | Plan today | Should |

### Blocking
- ...

### Non-blocking
- ...
```

If there are blocking items, update the plan's Steps to include the fixes, and tell the user what changed. Return to the calling dispatcher's logging phase if there is one.

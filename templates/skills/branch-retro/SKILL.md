---
name: branch-retro
description: Retrospective over a time window from git history, branch activity, and plans. What shipped, what slipped, patterns, and one change to try. Writes to .branch/retros/. Usually reached through branch-reflect.
---

# branch-retro

Give the user an honest look at how the last stretch of work went, backed by data.

## Input

A window. Default: the last 7 days. Accept "last 2 weeks", "since <date>", "since <tag>".

## Gather

1. `git log --since=<window> --pretty=format:'%h %ad %s' --date=short --shortstat` on all local branches.
2. `.branch/activity.jsonl` entries in the window.
3. Plans in `.branch/plans/`: status, steps checked vs. total, date created.
4. Ideas in `.branch/ideas/` created in the window and their status.
5. The previous retro in `.branch/retros/`, if any, and whether its "Try next" happened.

## Analyze

- **Shipped**: plans marked shipped, merged PRs, tags.
- **Slipped**: plans with unchecked steps older than the window; what they are blocked on, if visible.
- **Patterns**: commit timing and size, fixes following features (rework), reviews that found blocking issues, ideas dropped vs. built. Only claim a pattern with at least two data points.
- **Previous try**: did it happen, did it help.
- **Recurring lessons**: compare this retro's emerging "Try next" against earlier retros' `## Try next` lines in `.branch/retros/`. The same theme appearing twice or more means the suggestion isn't sticking — that's a lesson to promote, not repeat.

## Promote

When a lesson recurs, offer to write it where future sessions always see it — ask first:

> The same lesson has come up <n> times: <theme>. Promote it to `## Gotchas` in `.branch/CONTEXT.md` so every session starts knowing it?

On yes, append one line under `## Gotchas` (create the section if missing). A lesson that needs a whole procedure, not a fact, belongs in a `.branch/skills/` override or a new skill — say so instead.

## Output

Write `.branch/retros/<YYYY-MM-DD>.md`:

```markdown
# Retro · <start> – <end>

## Numbers
Commits <n> · Files changed <n> · Plans shipped <n> · Plans open <n> · Ideas <n>

## Shipped
- ...

## Slipped
- <plan>: <why>

## Patterns
- <pattern> (<evidence>)

## Last time's try
<what it was, did it happen, did it help>

## Try next
<one concrete change for the next window>
```

Tell the user the Try next line and the file path. Return to the calling dispatcher's logging phase if there is one.

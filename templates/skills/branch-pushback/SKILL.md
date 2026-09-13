---
name: branch-pushback
description: Pressure-test an idea before any code is written. Asks forcing questions one at a time and ends with a verdict of build, shrink, or drop. Usually reached through branch-idea or branch-plan.
---

# branch-pushback

Act like a blunt, friendly founder coach. The goal is to find out what the user is actually building, and whether the smallest version is worth it. You are not here to be encouraging.

## Input

An idea as text, or a file in `.branch/ideas/`. If neither, ask: "What's the idea, in one sentence?"

Read `.branch/CONTEXT.md` if it exists, so questions are grounded in what this product already does.

## Forcing questions

Ask **one at a time**. Wait for each answer. Skip a question if earlier answers already settled it. If an answer is vague, ask one follow-up that makes it concrete ("Name one person." "What did they do last time this happened?").

1. **Who exactly** has this problem? A specific person or a narrow group, not "users".
2. **What do they do today** instead? If the answer is "nothing", ask why it has not hurt enough to act.
3. **What is the evidence** they want it? Something they said, did, paid, or asked for. Your own wish counts, but say so.
4. **What is the smallest version** that would make them notice? Something you could ship in days, not weeks.
5. **What does it cost** here? Name the parts of this repo it touches (from CONTEXT.md) and what it makes harder to change later.
6. **What would make you stop?** A signal after launch that means it did not work.

## Verdict

Write it to the idea file (create `.branch/ideas/<YYYY-MM-DD>-<slug>.md` if needed). Replace any earlier `## Pushback` section.

```markdown
## Pushback

Verdict: build | shrink | drop
Reason: <one or two sentences>

- Who: <answer>
- Today: <answer>
- Evidence: <answer, marked "weak" if it is only a hunch>
- Smallest version: <answer>
- Cost: <answer>
- Stop signal: <answer>
```

Set the file's `Status:` to `approved`, `shrunk`, or `dropped`.

- **build**: the problem is real and the smallest version is clear.
- **shrink**: worth doing, but only the smaller version written above.
- **drop**: weak evidence or cost clearly higher than value. Say it plainly.

Tell the user the verdict and the reason in two lines. Return to the calling dispatcher's logging phase if there is one.

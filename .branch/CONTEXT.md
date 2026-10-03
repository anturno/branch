# @anturno/branch

Scanned: 2026-10-03T21:54:17.385Z

## What it is
A CLI (`bunx @anturno/branch init`) that scans a repo, writes `.branch/context.json`, and installs an idea-to-ship workflow as agent skills for Claude Code or Codex. For developers working with AI coding agents.

## Stack
TypeScript (strict, ESM), no runtime deps beyond `@clack/prompts` and `zod`. Bun 1.4+ for dev/tests/build; the packed CLI must run on Node 22+ — `src/` uses `node:*` modules only, never `Bun.*` APIs (CI enforces this). `site/` is a separate app with its own toolchain. GitHub Actions CI + Pages.

## Commands
| Task | Command |
|------|---------|
| Install | `bun install` |
| Dev / run CLI | `bun run src/cli.ts` (alias `bun run dev`) |
| Test | `bun test` |
| Typecheck | `bun run typecheck` |
| Build | `bun run build` |
| Full check | `bun run typecheck && bun test && bun run build` |

## Layout
- `src/cli.ts` — command parsing and clack output
- `src/scanner/` — deterministic repo scan → `context.json` (index.ts, maps.ts is the detection tables, schema.ts is the zod schema, fs.ts helpers)
- `src/install.ts` — skill install + `CLAUDE.md`/`AGENTS.md` block upsert, manifest tracks hashes so user-edited skills are kept
- `src/paths.ts` — `Layout` per host (claude→`.claude/`, codex→`.agents/`); `findRoot` walks up to `.git`
- `src/state.ts` — `scanAndWrite`, `info()` pre-computed state for the agent
- `src/launch.ts` — spawns the agent with `<branch-info>` state in the system prompt; `BRANCH_AGENT_DEPTH` guards re-launch
- `templates/skills/<name>/SKILL.md` — the 13 workflow skills; `{{SKILLS_DIR}}`, `{{INVOKE}}`, `{{VERSION}}` rendered per host at install
- `templates/agent-block.md` — managed block between `<!-- branch:start -->`/`<!-- branch:end -->`
- `test/` — `bun:test`, temp-dir fixtures via `fixture()` in helpers.ts
- `site/` — the website (branch.anturno.cloud), own build

## Conventions
- Skills are dispatchers: phases, one question at a time, route keywords, a `→ ran <skill>` transparency line, then `.branch/activity.jsonl` gets one JSON line per run (`ts`, `skill`, `route`, `subject`, `artifact`, `next`).
- Artifacts are plain markdown in `.branch/` with `Key: value` header lines (`Status:`, `Idea:`) — ideas/plans named `<YYYY-MM-DD>-<kebab-slug>.md`.
- Cross-skill references only through `{{SKILLS_DIR}}`/`{{INVOKE}}`, never hard-coded paths.
- Code style: compact, named exports, `node:`-prefixed imports, no comments unless needed.

## Environment
`BRANCH_AGENT_DEPTH` (launch guard) is the only var the CLI itself reads.

## Gotchas
- Never read `.env*` — only env var names are scanned.
- `branch info` counts `.branch/ideas|plans|retros` and shows the last activity line; skills rely on the `<branch-info>` block at launch.
- CONTRIBUTING.md requires an `Unreleased` CHANGELOG.md entry for user-facing changes and tests for behavior changes.
- Artifact dates come from `date`, never the model's assumption — a whole batch of cards was once misdated by days.

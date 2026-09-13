# Contributing to branch

Thanks for helping. Bug reports, skill improvements, and scanner support for new stacks are all welcome.

## Before you start

- For anything larger than a small fix, open an issue first so we can agree on the approach.
- Security problems go through [SECURITY.md](SECURITY.md), not public issues.

## Setup

Development uses [Bun](https://bun.sh) 1.4 or newer for dependencies, tests, and builds. The published CLI is plain JavaScript and must keep running on Node.js 20.12+, so do not use `Bun.*` APIs in `src/`; stick to `node:*` modules. CI runs the packed CLI on Node to enforce this.

```bash
git clone https://github.com/anturno/branch.git
cd branch
bun install
bun test
```

## Project layout

| Path | What lives there |
|------|------------------|
| `src/cli.ts` | Command parsing and output |
| `src/scanner/` | Deterministic repo scan that produces `.branch/context.json` |
| `src/install.ts` | Installs skills and the agent block, tracks edits via the manifest |
| `src/launch.ts` | Opens the agent with pre-computed state |
| `templates/skills/<name>/SKILL.md` | The workflow skills. `{{SKILLS_DIR}}` and `{{INVOKE}}` are filled in per host |
| `templates/agent-block.md` | Block added to `CLAUDE.md` / `AGENTS.md` |
| `test/` | `bun:test` suites |
| `scripts/build.ts` | Bundles `src/cli.ts` into `dist/cli.js` for Node with `Bun.build` |

## Making changes

1. Branch from `main`.
2. Keep changes focused. One concern per pull request.
3. Add or update tests for behavior changes. Scanner changes need a fixture in `test/scanner.test.ts`.
4. Run the full check before pushing:

   ```bash
   bun run typecheck && bun test && bun run build
   ```

5. Try the CLI against a real repo:

   ```bash
   bun run dev -- init --cwd ../some-repo

   Or test the packed build exactly as users get it:

   ```bash
   bun run build && bun pm pack
   bunx --package=./anturno-branch-0.0.1.tgz branch init --cwd ../some-repo
   ```
   ```

## Writing skills

- Skills talk in outcomes, not skill names. Skill names only appear in the `→ ran <skill>` transparency line.
- Reference other skills through `{{SKILLS_DIR}}` and `{{INVOKE}}`, never hard-coded paths, so they work for both Claude Code and Codex.
- Never instruct the agent to read `.env` files or anything holding secrets.

## Pull requests

- Describe what changed, why, and how you tested it.
- Add an entry under `Unreleased` in [CHANGELOG.md](CHANGELOG.md) for user-facing changes.
- CI must pass.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) and that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

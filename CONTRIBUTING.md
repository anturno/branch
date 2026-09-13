# Contributing to branch

Thanks for helping. Bug reports, skill improvements, and scanner support for new stacks are all welcome.

## Before you start

- For anything larger than a small fix, open an issue first so we can agree on the approach.
- Security problems go through [SECURITY.md](SECURITY.md), not public issues.

## Setup

Requires Node.js 22.12 or newer for development (the published CLI runs on Node 20.12+).

```bash
git clone https://github.com/anturno/branch.git
cd branch
npm install
npm test
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
| `test/` | Vitest suites |

## Making changes

1. Branch from `main`.
2. Keep changes focused. One concern per pull request.
3. Add or update tests for behavior changes. Scanner changes need a fixture in `test/scanner.test.ts`.
4. Run the full check before pushing:

   ```bash
   npm run typecheck && npm test && npm run build
   ```

5. Try the CLI against a real repo:

   ```bash
   npm pack
   npx --package=./anturno-branch-0.0.1.tgz branch init --cwd ../some-repo
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

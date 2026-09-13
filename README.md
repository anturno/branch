# branch

[![CI](https://github.com/anturno/branch/actions/workflows/ci.yml/badge.svg)](https://github.com/anturno/branch/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@anturno/branch)](https://www.npmjs.com/package/@anturno/branch)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Give your AI agent the context and skills to build better products.

branch scans your repo, writes what it finds to `.branch/context.json`, and installs an idea-to-ship workflow as agent skills. Your agent then writes `.branch/CONTEXT.md` (stack, commands, conventions, gotchas) and works from it in every session.

## Quick start

Requires Node.js 20.12 or newer.

```bash
npx @anturno/branch init
```

Then open Claude Code in the repo and run `/branch-start`. Or do both at once:

```bash
npx @anturno/branch init --launch
```

## The workflow

| Command | What it does |
|---------|--------------|
| `/branch-start` | Writes `.branch/CONTEXT.md`, shows the home screen |
| `/branch-idea` | Capture an idea, think it through, or pressure-test it |
| `/branch-plan` | Break it into verifiable steps, or lock down the architecture |
| `/branch-build` | Work through a plan step by step, fix a bug, or spike |
| `/branch-review` | Code review, security review, or ready-to-ship checklist |
| `/branch-ship` | Pre-flight, open a PR, or cut a release |
| `/branch-reflect` | Retro, recent history, or refresh the agent's context |

Each command asks one plain question when you give it nothing, and routes directly when you do (`/branch-plan eng`, `/branch-build fix login redirect loops`). Work is saved to the repo:

```
.branch/
  context.json     deterministic scan (branch scan)
  CONTEXT.md       agent-written context, read every session
  ideas/  plans/  retros/
  activity.jsonl   what ran, what it produced, what's next
  manifest.json    hashes of installed skills
```

## CLI

| Command | What it does |
|---------|--------------|
| `branch init` | Scan, install skills, add the branch block to `CLAUDE.md` |
| `branch scan` | Re-scan and report what changed |
| `branch update` | Refresh skills. Files you edited are kept unless `--force` |
| `branch doctor` | Check the install |
| `branch info` | Print state as JSON |
| `branch start` | Open the agent on `/branch-start` |

Options: `--host codex` installs to `.agents/skills` and `AGENTS.md`. `--global` installs skills to your home directory.

## What the scan reads

Manifests, lockfiles, workspace config, CI and deploy files, `.env.example`, and source files for env var **names**. It never opens `.env` files and never sends anything anywhere. Everything else is read by your agent, on your machine.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, project layout, and how skills are written. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security issues privately as described in [SECURITY.md](SECURITY.md).

```bash
npm install
npm test
npm run build
```

## License

[MIT](LICENSE)

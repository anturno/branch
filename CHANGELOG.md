# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Work cards: every unit of work now gets `.branch/work/<slug>.md` tracking its stage (`captured` → `planned` → `building` → `shipped`, more statuses reserved) and linking its idea, plan, and PR. Skills create and update cards as they run; `branch info` and the `/branch-start` home screen report the count.

## [0.0.1]

### Added

- `branch init`, `scan`, `update`, `doctor`, `info`, and `start` commands.
- Deterministic repo scanner that writes `.branch/context.json`.
- Runs with Bun 1.4+ (`bunx`) or Node.js 22+ (`npx`).
- Idea-to-ship workflow skills for Claude Code and Codex: `branch-start`, `branch-idea`, `branch-plan`, `branch-build`, `branch-review`, `branch-ship`, `branch-reflect`.

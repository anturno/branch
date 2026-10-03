import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import * as p from "@clack/prompts";
import { hasBlock, installSkills, skillNames, type InstallResult } from "./install.js";
import { agentAvailable, launch } from "./launch.js";
import { type Host, findRoot, layout, packageVersion } from "./paths.js";
import { scan, diffContext } from "./scanner/index.js";
import { info, readContext, scanAndWrite } from "./state.js";
import { pullIssue } from "./pull.js";
import { openWorktree } from "./work.js";
import { nextAction, queueSummary, scanCards } from "./tick.js";
import { computeMetrics, formatMetrics, recordMetrics } from "./metrics.js";

const HELP = `branch ${packageVersion()}
Give your AI agent the context and skills to build better products.

Usage: branch <command> [options]

Commands
  init      Scan the repo, install skills, add the context block to CLAUDE.md / AGENTS.md
  scan      Re-scan the repo and report what changed
  update    Refresh installed skills (keeps files you edited unless --force)
  doctor    Check the install
  info      Print branch state as JSON
  start     Open the agent on /branch-start
  review    Open a fresh agent session on /branch-review
  pull      Pull a GitHub issue into the work queue (--launch opens triage)
  work      Build a work item in its own git worktree: branch work <slug>
  tick      Advance the work queue once (--launch runs it; for schedulers)
  metrics   Count outcomes — cards by status, runs by stage, review findings

Options
  --host <claude|codex>  Agent to install for (default: claude)
  --global               Install skills in your home directory instead of the repo
  --force                Overwrite skills you edited
  --launch               After init, open the agent on /branch-start
  --cwd <dir>            Run against another directory
  -h, --help             Show help
  -v, --version          Show version
`;

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      host: { type: "string" },
      global: { type: "boolean" },
      force: { type: "boolean" },
      launch: { type: "boolean" },
      cwd: { type: "string" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.version) {
    console.log(packageVersion());
    return 0;
  }
  const command = positionals[0];
  if (values.help || !command || command === "help") {
    console.log(HELP);
    return command || values.help ? 0 : 1;
  }

  const host = (values.host ?? "claude") as Host;
  if (host !== "claude" && host !== "codex") {
    console.error(`branch: unknown host "${values.host}". Use claude or codex.`);
    return 1;
  }
  const l = layout({ root: findRoot(values.cwd ?? process.cwd()), host, global: values.global });

  switch (command) {
    case "init":
      return init(l, { force: values.force, launch: values.launch });
    case "scan":
      return runScan(l);
    case "update":
      return update(l, values.force);
    case "doctor":
      return doctor(l);
    case "info":
      console.log(JSON.stringify(info(l), null, 2));
      return 0;
    case "start":
      return launch(l, `${l.invoke}branch-start`);
    case "review":
      return launch(l, `${l.invoke}branch-review ${positionals.slice(1).join(" ")}`.trim());
    case "pull":
      return runPull(l, positionals[1], values.launch);
    case "work":
      return runWork(l, positionals[1]);
    case "tick":
      return runTick(l, values.launch);
    case "metrics": {
      const m = computeMetrics(l);
      recordMetrics(l, m);
      console.log(formatMetrics(m));
      return 0;
    }
    default:
      console.error(`branch: unknown command "${command}"\n`);
      console.log(HELP);
      return 1;
  }
}

async function init(l: ReturnType<typeof layout>, opts: { force?: boolean; launch?: boolean }) {
  p.intro(`branch ${packageVersion()}`);
  const scanned = scanAndWrite(l);
  const c = scanned.context;
  p.log.step(`Scanned ${c.name}`);
  p.log.message(summarize(c));
  p.log.success(`${relative(l.root, l.contextPath)} ${scanned.status}`);

  reportInstall(l, installSkills(l, { force: opts.force }));

  const next = `${l.invoke}branch-start`;
  if (opts.launch) {
    p.outro(`Opening ${l.host} on ${next}`);
    return launch(l, next);
  }
  p.outro(`Next: open ${l.host === "claude" ? "Claude Code" : "Codex"} in this repo and run ${next}`);
  return 0;
}

function runScan(l: ReturnType<typeof layout>) {
  const { context, status, changed } = scanAndWrite(l);
  p.log.message(summarize(context));
  if (status === "updated") {
    p.log.warn(`Changed: ${changed.join(", ")}. Run ${l.invoke}branch-reflect context to refresh CONTEXT.md.`);
  } else {
    p.log.success(`${relative(l.root, l.contextPath)} ${status}`);
  }
  return 0;
}

function update(l: ReturnType<typeof layout>, force?: boolean) {
  reportInstall(l, installSkills(l, { force }));
  return 0;
}

async function runPull(l: ReturnType<typeof layout>, ref: string | undefined, launchAgent?: boolean) {
  if (!ref) {
    console.error("branch: pull needs an issue number or URL");
    return 1;
  }
  let r: ReturnType<typeof pullIssue>;
  try {
    r = pullIssue(l, ref);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
  p.log.success(`${relative(l.root, r.path)} ${r.deduped ? "already in the queue" : "captured"}`);
  const next = `${l.invoke}branch-triage ${r.slug}`;
  if (launchAgent) {
    p.outro(`Opening ${l.host} on ${next}`);
    return launch(l, next);
  }
  p.outro(`Next: ${next}`);
  return 0;
}

async function runWork(l: ReturnType<typeof layout>, slug: string | undefined) {
  if (!slug) {
    console.error("branch: work needs a work-item slug (a card in .branch/work/)");
    return 1;
  }
  if (!existsSync(join(l.stateDir, "work", `${slug}.md`))) {
    console.error(`branch: no card for "${slug}" in .branch/work/ — capture or pull it first.`);
    return 1;
  }
  let dir: string;
  try {
    dir = openWorktree(l, slug);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
  p.log.warn("Worktrees share ports, daemons and packages with the main checkout — two runs can't each bind the same port.");
  p.outro(`Opening ${l.host} in ${relative(l.root, dir)}`);
  return launch(l, `${l.invoke}branch-build task ${slug}`, { cwd: dir });
}

async function runTick(l: ReturnType<typeof layout>, launchAgent?: boolean) {
  const cards = scanCards(l);
  const { pending, inFlight, idle } = queueSummary(cards);
  for (const c of pending) p.log.message(`${c.slug} — ${c.status}${c.verdict ? ` (${c.verdict})` : ""}`);
  for (const c of inFlight) p.log.message(`${c.slug} — ${c.status} (in flight)`);
  const action = nextAction(cards);
  if (!action) {
    p.outro(`Nothing pending (${idle} done)`);
    return 0;
  }
  const prompt = `${l.invoke}${action.prompt}`;
  if (launchAgent) {
    p.outro(`Opening ${l.host} on ${prompt}`);
    return launch(l, prompt);
  }
  p.outro(`Next: ${prompt} (--launch to run it)`);
  return 0;
}

function reportInstall(l: ReturnType<typeof layout>, r: InstallResult) {
  const skills = skillNames().length;
  const where = l.global ? l.skillsDirLabel : relative(l.root, l.skillsDir);
  p.log.success(
    `${skills} skills in ${where} (${r.written.length} new, ${r.updated.length} updated, ${r.unchanged.length} unchanged)` +
      (r.overridden.length > 0 ? ` · ${r.overridden.length} overridden` : ""),
  );
  if (r.skipped.length > 0) {
    p.log.warn(`Kept ${r.skipped.length} file(s) you edited:\n${r.skipped.join("\n")}\nUse --force to overwrite.`);
  }
  for (const b of r.blocks) p.log.success(`${b.file}: branch block ${b.action}`);
}

function doctor(l: ReturnType<typeof layout>) {
  const checks: [string, boolean, string?][] = [];
  const agent = l.host === "claude" ? "claude" : "codex";
  checks.push([`${agent} on PATH`, agentAvailable(agent), `install ${agent}`]);

  const context = readContext(l);
  checks.push(["context.json valid", context !== null, "run branch scan"]);
  if (context) {
    const drift = diffContext(context, scan(l.root));
    checks.push([
      "context.json fresh",
      drift.length === 0,
      `changed: ${drift.join(", ")}. Run branch scan`,
    ]);
  }
  const missing = skillNames().filter((n) => !existsSync(join(l.skillsDir, n, "SKILL.md")));
  checks.push(["skills installed", missing.length === 0, `missing ${missing.join(", ")}. Run branch update`]);
  for (const file of l.blockFiles) {
    checks.push([`${relative(l.root, file)} has branch block`, hasBlock(file), "run branch update"]);
  }
  checks.push([
    "CONTEXT.md written",
    existsSync(l.contextDocPath),
    `run ${l.invoke}branch-start in your agent`,
  ]);

  let failed = 0;
  for (const [label, ok, fix] of checks) {
    if (ok) p.log.success(label);
    else {
      failed++;
      p.log.error(`${label}: ${fix}`);
    }
  }
  return failed === 0 ? 0 : 1;
}

function summarize(c: NonNullable<ReturnType<typeof readContext>>): string {
  const line = (label: string, xs: string[]) => (xs.length ? `${label}: ${xs.join(", ")}` : null);
  return [
    line("Languages", c.languages),
    c.packageManager ? `Package manager: ${c.packageManager}` : null,
    c.monorepo.tool ? `Monorepo: ${c.monorepo.tool} (${c.monorepo.workspaces.join(", ") || "no packages"})` : null,
    line("Frameworks", c.frameworks),
    line("Tests", c.testFrameworks),
    line("Services", c.services.map((s) => s.name)),
    c.envVars.length ? `Env vars: ${c.envVars.length}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);

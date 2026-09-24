import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type Host = "claude" | "codex";

/** Package root. Works from src/*.ts (tests) and dist/cli.js (bundle). */
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const TEMPLATES_DIR = join(PACKAGE_ROOT, "templates");

export function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")) as {
    version: string;
  };
  return pkg.version;
}

/** Nearest ancestor containing .git, or the start directory. */
export function findRoot(start: string): string {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

export type Layout = {
  root: string;
  host: Host;
  global: boolean;
  /** Where skills are installed. */
  skillsDir: string;
  /** How skills reference each other inside SKILL.md files. */
  skillsDirLabel: string;
  /** Base for manifest keys. */
  installBase: string;
  manifestPath: string;
  stateDir: string;
  contextPath: string;
  contextDocPath: string;
  /** Agent instruction files that get the managed block. */
  blockFiles: string[];
  /** Prefix the host uses to invoke a skill. */
  invoke: string;
};

export function layout(opts: { root: string; host?: Host; global?: boolean; home?: string }): Layout {
  const host = opts.host ?? "claude";
  const global = opts.global ?? false;
  const home = opts.home ?? homedir();
  const hostDir = host === "claude" ? ".claude" : ".agents";
  const installBase = global ? home : opts.root;
  const stateDir = join(opts.root, ".branch");

  const blockFiles: string[] = [];
  if (!global) {
    const primary = host === "claude" ? "CLAUDE.md" : "AGENTS.md";
    blockFiles.push(join(opts.root, primary));
    const other = join(opts.root, host === "claude" ? "AGENTS.md" : "CLAUDE.md");
    if (existsSync(other)) blockFiles.push(other);
  }

  return {
    root: opts.root,
    host,
    global,
    skillsDir: join(installBase, hostDir, "skills"),
    skillsDirLabel: global ? `~/${hostDir}/skills` : `${hostDir}/skills`,
    installBase,
    manifestPath: global ? join(home, ".branch", `manifest-${host}.json`) : join(stateDir, "manifest.json"),
    stateDir,
    contextPath: join(stateDir, "context.json"),
    contextDocPath: join(stateDir, "CONTEXT.md"),
    blockFiles,
    invoke: host === "claude" ? "/" : "$",
  };
}

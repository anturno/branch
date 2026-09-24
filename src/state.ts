import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { type Context, ContextSchema, diffContext, scan } from "./scanner/index.js";
import { hasBlock, skillNames } from "./install.js";
import { type Layout, packageVersion } from "./paths.js";

export function readContext(l: Layout): Context | null {
  try {
    return ContextSchema.parse(JSON.parse(readFileSync(l.contextPath, "utf8")));
  } catch {
    return null;
  }
}

export type ScanResult = {
  context: Context;
  status: "created" | "updated" | "unchanged";
  changed: string[];
};

/** Scans and writes context.json. Leaves the file untouched when nothing but the timestamp changed. */
export function scanAndWrite(l: Layout, now = new Date()): ScanResult {
  const prev = readContext(l);
  const next = scan(l.root, now);
  if (prev) {
    const changed = diffContext(prev, next);
    if (changed.length === 0) return { context: prev, status: "unchanged", changed };
    writeJson(l.contextPath, next);
    return { context: next, status: "updated", changed };
  }
  writeJson(l.contextPath, next);
  return { context: next, status: "created", changed: [] };
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

const countMd = (dir: string) => {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".md")).length;
  } catch {
    return 0;
  }
};

export type Info = ReturnType<typeof info>;

/** Pre-computed state handed to the agent so skills don't shell out to discover it. */
export function info(l: Layout) {
  const context = readContext(l);
  const installed = skillNames().filter((name) => existsSync(join(l.skillsDir, name, "SKILL.md")));
  return {
    branchVersion: packageVersion(),
    root: l.root,
    host: l.host,
    skillsDir: l.skillsDirLabel,
    skills: { installed, missing: skillNames().filter((n) => !installed.includes(n)) },
    context: {
      path: relative(l.root, l.contextPath),
      exists: context !== null,
      scannedAt: context?.scannedAt ?? null,
      summary: context
        ? {
            name: context.name,
            languages: context.languages,
            frameworks: context.frameworks,
            packageManager: context.packageManager,
          }
        : null,
    },
    contextDoc: { path: relative(l.root, l.contextDocPath), exists: existsSync(l.contextDocPath) },
    agentFiles: l.blockFiles.map((f) => ({ path: relative(l.root, f), hasBlock: hasBlock(f) })),
    work: {
      ideas: countMd(join(l.stateDir, "ideas")),
      plans: countMd(join(l.stateDir, "plans")),
      retros: countMd(join(l.stateDir, "retros")),
    },
    lastActivity: lastActivity(l),
  };
}

function lastActivity(l: Layout): Record<string, unknown> | null {
  try {
    const lines = readFileSync(join(l.stateDir, "activity.jsonl"), "utf8").trim().split("\n");
    return JSON.parse(lines[lines.length - 1]!) as Record<string, unknown>;
  } catch {
    return null;
  }
}

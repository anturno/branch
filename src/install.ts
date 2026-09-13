import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { type Layout, TEMPLATES_DIR, packageVersion } from "./paths.js";

export const BLOCK_START = "<!-- branch:start -->";
export const BLOCK_END = "<!-- branch:end -->";

type Manifest = { version: string; host: string; files: Record<string, string> };

export type InstallResult = {
  written: string[];
  updated: string[];
  unchanged: string[];
  /** Files the user edited since install. Left alone unless force. */
  skipped: string[];
  blocks: { file: string; action: "created" | "updated" | "unchanged" }[];
};

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

export function render(template: string, l: Layout): string {
  return template
    .replaceAll("{{SKILLS_DIR}}", l.skillsDirLabel)
    .replaceAll("{{INVOKE}}", l.invoke)
    .replaceAll("{{VERSION}}", packageVersion());
}

/** Template skill files as paths relative to templates/skills. */
export function templateSkillFiles(): string[] {
  const base = join(TEMPLATES_DIR, "skills");
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(relative(base, full));
    }
  };
  walk(base);
  return out;
}

export function skillNames(): string[] {
  return [...new Set(templateSkillFiles().map((f) => f.split(/[\\/]/)[0]!))];
}

function readManifest(path: string): Manifest | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Manifest;
  } catch {
    return null;
  }
}

export function installSkills(l: Layout, opts: { force?: boolean } = {}): InstallResult {
  const result: InstallResult = { written: [], updated: [], unchanged: [], skipped: [], blocks: [] };
  const prev = readManifest(l.manifestPath);
  const next: Manifest = { version: packageVersion(), host: l.host, files: {} };

  for (const rel of templateSkillFiles()) {
    const content = render(readFileSync(join(TEMPLATES_DIR, "skills", rel), "utf8"), l);
    const dest = join(l.skillsDir, rel);
    const key = relative(l.installBase, dest);
    const hash = sha(content);

    if (!existsSync(dest)) {
      write(dest, content);
      result.written.push(key);
      next.files[key] = hash;
      continue;
    }
    const current = readFileSync(dest, "utf8");
    const currentHash = sha(current);
    if (currentHash === hash) {
      result.unchanged.push(key);
      next.files[key] = hash;
    } else if (opts.force || prev?.files[key] === currentHash) {
      write(dest, content);
      result.updated.push(key);
      next.files[key] = hash;
    } else {
      result.skipped.push(key);
      // Keep the old baseline so a later update still sees the edit.
      if (prev?.files[key]) next.files[key] = prev.files[key];
    }
  }

  for (const file of l.blockFiles) {
    result.blocks.push({ file: relative(l.root, file), action: upsertBlock(file, renderBlock(l)) });
  }

  const serialized = `${JSON.stringify(next, null, 2)}\n`;
  if (readTextOrNull(l.manifestPath) !== serialized) write(l.manifestPath, serialized);
  return result;
}

export function renderBlock(l: Layout): string {
  return render(readFileSync(join(TEMPLATES_DIR, "agent-block.md"), "utf8"), l).trim();
}

export function upsertBlock(file: string, block: string): "created" | "updated" | "unchanged" {
  const existing = readTextOrNull(file);
  if (existing === null) {
    write(file, `${block}\n`);
    return "created";
  }
  const start = existing.indexOf(BLOCK_START);
  const end = existing.indexOf(BLOCK_END);
  let next: string;
  if (start !== -1 && end > start) {
    next = existing.slice(0, start) + block + existing.slice(end + BLOCK_END.length);
  } else {
    next = `${existing.replace(/\s*$/, "")}\n\n${block}\n`;
  }
  if (next === existing) return "unchanged";
  write(file, next);
  return "updated";
}

export function hasBlock(file: string): boolean {
  const text = readTextOrNull(file);
  return text !== null && text.includes(BLOCK_START) && text.includes(BLOCK_END);
}

function readTextOrNull(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function write(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

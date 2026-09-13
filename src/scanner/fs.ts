import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".vercel",
  ".venv",
  "venv",
  "__pycache__",
  "target",
  "vendor",
  ".branch",
]);

export function exists(root: string, ...parts: string[]): boolean {
  return existsSync(join(root, ...parts));
}

export function readText(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

export function readJson<T = unknown>(path: string): T | null {
  const text = readText(path);
  if (text === null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function listDir(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

export function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** Walks source files breadth-first, skipping build and dependency folders. */
export function walkFiles(
  root: string,
  opts: { extensions: string[]; maxFiles: number; maxBytes: number },
): string[] {
  const out: string[] = [];
  const queue = [root];
  while (queue.length > 0 && out.length < opts.maxFiles) {
    const dir = queue.shift()!;
    for (const entry of listDir(dir).sort()) {
      if (IGNORED_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        if (!entry.startsWith(".") || entry === ".github") queue.push(full);
      } else if (
        stat.size <= opts.maxBytes &&
        opts.extensions.some((ext) => entry.endsWith(ext))
      ) {
        out.push(relative(root, full));
        if (out.length >= opts.maxFiles) break;
      }
    }
  }
  return out;
}

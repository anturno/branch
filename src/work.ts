import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Layout } from "./paths.js";

function git(root: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" });
  } catch (e) {
    const detail = e instanceof Error && "stderr" in e ? String(e.stderr).trim() : "";
    throw new Error(`branch: git ${args[0]} failed.${detail ? ` ${detail}` : ""}`);
  }
}

/**
 * Ensures a worktree exists at .branch/worktrees/<slug> on branch <slug>.
 * Resumes the existing checkout on re-run. Returns the worktree path.
 */
export function openWorktree(l: Layout, slug: string): string {
  const dir = join(l.stateDir, "worktrees", slug);
  if (!existsSync(dir)) {
    const branchExists = git(l.root, ["branch", "--list", slug]).trim() !== "";
    git(l.root, ["worktree", "add", dir, ...(branchExists ? [slug] : ["-b", slug])]);
  }
  excludeWorktrees(l);
  return dir;
}

/** Hides .branch/worktrees/ from git status via .git/info/exclude — never touches .gitignore. */
function excludeWorktrees(l: Layout) {
  const exclude = join(l.root, ".git", "info", "exclude");
  const line = `/${relative(l.root, join(l.stateDir, "worktrees"))}/`;
  const current = existsSync(exclude) ? readFileSync(exclude, "utf8") : "";
  if (!current.includes(line)) writeFileSync(exclude, `${current}${current.endsWith("\n") || current === "" ? "" : "\n"}${line}\n`);
}

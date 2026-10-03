import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { layout } from "../src/paths.js";
import { openWorktree } from "../src/work.js";
import { fixture } from "./helpers.js";

const git = (root: string, args: string[]) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" });

function gitRepo(): string {
  const root = fixture({ "x.txt": "hi" });
  git(root, ["init", "-q"]);
  git(root, ["add", "."]);
  git(root, ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"]);
  return root;
}

describe("openWorktree", () => {
  it("creates a worktree on a new branch, hides it from status, resumes on re-run", () => {
    const root = gitRepo();
    const l = layout({ root });

    const dir = openWorktree(l, "item-a");
    expect(existsSync(join(dir, "x.txt"))).toBe(true);
    expect(readFileSync(join(root, ".git/info/exclude"), "utf8")).toContain("/.branch/worktrees/");

    // Re-run resumes the same checkout.
    expect(openWorktree(l, "item-a")).toBe(dir);

    // Dir removed but branch kept → reuses the branch instead of failing.
    git(root, ["worktree", "remove", dir]);
    expect(openWorktree(l, "item-a")).toBe(dir);
    // "+ item-a" marks a branch checked out in a worktree.
    expect(git(root, ["branch", "--list", "item-a"]).trim()).toContain("item-a");
  });
});

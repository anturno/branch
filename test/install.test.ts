import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLOCK_END, BLOCK_START, installSkills, skillNames, upsertBlock } from "../src/install.js";
import { layout } from "../src/paths.js";
import { info, scanAndWrite } from "../src/state.js";
import { fixture } from "./helpers.js";

const read = (path: string) => readFileSync(path, "utf8");

describe("installSkills", () => {
  it("installs every skill with rendered paths and a CLAUDE.md block", () => {
    const root = fixture({ "CLAUDE.md": "# Existing rules\n" });
    const l = layout({ root });

    const r = installSkills(l);

    expect(skillNames()).toContain("branch-start");
    expect(r.written).toHaveLength(skillNames().length);
    for (const name of skillNames()) {
      const skill = read(join(root, ".claude/skills", name, "SKILL.md"));
      expect(skill).toMatch(new RegExp(`^---\\nname: ${name}\\n`));
      expect(skill).not.toContain("{{");
    }
    expect(read(join(root, ".claude/skills/branch-plan-eng/SKILL.md"))).toContain(".claude/skills/branch-plan-feature/SKILL.md");

    const claude = read(join(root, "CLAUDE.md"));
    expect(claude.startsWith("# Existing rules\n\n<!-- branch:start -->")).toBe(true);
    expect(claude).toContain("/branch-start");
    expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
    expect(r.blocks).toEqual([{ file: "CLAUDE.md", action: "updated" }]);
  });

  it("is idempotent", () => {
    const root = fixture({});
    const l = layout({ root });
    installSkills(l);
    const snapshot = [read(join(root, "CLAUDE.md")), read(l.manifestPath)];

    const r = installSkills(l);

    expect(r.written).toEqual([]);
    expect(r.updated).toEqual([]);
    expect(r.unchanged).toHaveLength(skillNames().length);
    expect(r.blocks).toEqual([{ file: "CLAUDE.md", action: "unchanged" }]);
    expect([read(join(root, "CLAUDE.md")), read(l.manifestPath)]).toEqual(snapshot);
  });

  it("keeps skills the user edited unless forced", () => {
    const root = fixture({});
    const l = layout({ root });
    installSkills(l);
    const file = join(root, ".claude/skills/branch-plan/SKILL.md");
    writeFileSync(file, "my version");

    const r = installSkills(l);
    expect(r.skipped).toEqual([".claude/skills/branch-plan/SKILL.md"]);
    expect(read(file)).toBe("my version");

    // Still protected on the next run.
    expect(installSkills(l).skipped).toEqual([".claude/skills/branch-plan/SKILL.md"]);

    const forced = installSkills(l, { force: true });
    expect(forced.updated).toEqual([".claude/skills/branch-plan/SKILL.md"]);
    expect(read(file)).toContain("name: branch-plan");
  });

  it("updates untouched skills whose template changed", () => {
    const root = fixture({});
    const l = layout({ root });
    installSkills(l);
    const file = join(root, ".claude/skills/branch-retro/SKILL.md");
    // Simulate an older installed version: file and manifest agree, template differs.
    writeFileSync(file, "old template");
    const manifest = JSON.parse(read(l.manifestPath));
    manifest.files[".claude/skills/branch-retro/SKILL.md"] = createHash("sha256").update("old template").digest("hex");
    writeFileSync(l.manifestPath, JSON.stringify(manifest));

    const r = installSkills(l);
    expect(r.updated).toEqual([".claude/skills/branch-retro/SKILL.md"]);
    expect(r.skipped).toEqual([]);
  });

  it("targets .agents/skills and AGENTS.md for codex, and also updates an existing CLAUDE.md", () => {
    const root = fixture({ "CLAUDE.md": "rules" });
    const l = layout({ root, host: "codex" });

    installSkills(l);

    expect(existsSync(join(root, ".agents/skills/branch-start/SKILL.md"))).toBe(true);
    expect(existsSync(join(root, ".claude/skills"))).toBe(false);
    expect(read(join(root, "AGENTS.md"))).toContain("$branch-start");
    expect(read(join(root, "CLAUDE.md"))).toContain(BLOCK_START);
    expect(read(join(root, ".agents/skills/branch-plan-eng/SKILL.md"))).toContain(".agents/skills/branch-plan-feature");
  });

  it("installs globally without touching the repo's agent files", () => {
    const root = fixture({});
    const home = mkdtempSync(join(tmpdir(), "branch-home-"));
    const l = layout({ root, global: true, home });

    const r = installSkills(l);

    expect(existsSync(join(home, ".claude/skills/branch-start/SKILL.md"))).toBe(true);
    expect(existsSync(join(home, ".branch/manifest-claude.json"))).toBe(true);
    expect(existsSync(join(root, "CLAUDE.md"))).toBe(false);
    expect(r.blocks).toEqual([]);
    expect(read(join(home, ".claude/skills/branch-plan-eng/SKILL.md"))).toContain("~/.claude/skills/branch-plan-feature");
  });
});

describe("upsertBlock", () => {
  it("replaces an existing block in place", () => {
    const root = fixture({ "CLAUDE.md": `top\n\n${BLOCK_START}\nold\n${BLOCK_END}\n\nbottom\n` });
    const file = join(root, "CLAUDE.md");
    expect(upsertBlock(file, `${BLOCK_START}\nnew\n${BLOCK_END}`)).toBe("updated");
    expect(read(file)).toBe(`top\n\n${BLOCK_START}\nnew\n${BLOCK_END}\n\nbottom\n`);
  });
});

describe("scanAndWrite and info", () => {
  it("only rewrites context.json when the scan changes", () => {
    const root = fixture({ "package.json": { name: "app", dependencies: { react: "19" } } });
    const l = layout({ root });

    expect(scanAndWrite(l, new Date("2026-01-01")).status).toBe("created");
    const first = read(l.contextPath);
    expect(scanAndWrite(l, new Date("2026-02-01")).status).toBe("unchanged");
    expect(read(l.contextPath)).toBe(first);

    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "app", dependencies: { vue: "3" } }));
    const r = scanAndWrite(l, new Date("2026-03-01"));
    expect(r.status).toBe("updated");
    expect(r.changed).toEqual(["frameworks"]);
  });

  it("reports install state and last activity", () => {
    const root = fixture({
      "package.json": { name: "app" },
      ".branch/plans/2026-09-01-a.md": "# a",
      ".branch/activity.jsonl": '{"skill":"branch-idea"}\n{"skill":"branch-plan","next":"/branch-build"}\n',
    });
    const l = layout({ root });
    scanAndWrite(l);
    installSkills(l);

    const i = info(l);
    expect(i.skills.missing).toEqual([]);
    expect(i.context.exists).toBe(true);
    expect(i.contextDoc.exists).toBe(false);
    expect(i.agentFiles).toEqual([{ path: "CLAUDE.md", hasBlock: true }]);
    expect(i.work).toEqual({ ideas: 0, plans: 1, retros: 0 });
    expect(i.lastActivity).toEqual({ skill: "branch-plan", next: "/branch-build" });
  });
});

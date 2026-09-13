import { basename, join } from "node:path";
import { exists, isDir, listDir, readJson, readText, walkFiles } from "./fs.js";
import {
  JS_FRAMEWORKS,
  JS_TEST,
  JS_TOOLING,
  PY_FRAMEWORKS,
  PY_TEST,
  PY_TOOLING,
  SERVICES,
  lookup,
} from "./maps.js";
import { type Context, ContextSchema } from "./schema.js";

export { type Context, ContextSchema } from "./schema.js";

type PackageJson = {
  name?: string;
  packageManager?: string;
  workspaces?: string[] | { packages?: string[] };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const uniq = <T>(xs: T[]) => [...new Set(xs)];
const sorted = (xs: string[]) => uniq(xs).sort((a, b) => a.localeCompare(b));

export function scan(root: string, now: Date = new Date()): Context {
  const rootPkg = readJson<PackageJson>(join(root, "package.json"));
  const monorepo = detectMonorepo(root, rootPkg);
  const packageDirs = [".", ...monorepo.workspaces];

  const pkgs = new Map<string, PackageJson>();
  for (const dir of packageDirs) {
    const pkg = readJson<PackageJson>(join(root, dir, "package.json"));
    if (pkg) pkgs.set(dir, pkg);
  }
  const jsDeps = new Map<string, string>(); // dep -> first package dir that uses it
  for (const [dir, pkg] of pkgs) {
    for (const dep of Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    })) {
      if (!jsDeps.has(dep)) jsDeps.set(dep, dir);
    }
  }
  const pyDeps = new Set<string>();
  for (const dir of packageDirs) {
    for (const dep of readPythonDeps(join(root, dir))) pyDeps.add(dep);
  }

  const pick = (map: Record<string, string>, deps: Iterable<string>) => {
    const out: string[] = [];
    for (const dep of deps) {
      const hit = lookup(map, dep);
      if (hit) out.push(hit);
    }
    return out;
  };

  const services = new Map<string, Context["services"][number]>();
  for (const [dep, dir] of jsDeps) {
    const hit = lookup(SERVICES, dep);
    if (hit && !services.has(hit.name)) {
      services.set(hit.name, { ...hit, via: dir === "." ? dep : `${dep} (${dir})` });
    }
  }
  for (const dep of pyDeps) {
    const hit = lookup(SERVICES, dep);
    if (hit && !services.has(hit.name)) services.set(hit.name, { ...hit, via: dep });
  }

  const scripts: Context["scripts"] = {};
  for (const [dir, pkg] of pkgs) {
    if (pkg.scripts && Object.keys(pkg.scripts).length > 0) scripts[dir] = pkg.scripts;
  }

  const context: Context = {
    version: 1,
    scannedAt: now.toISOString(),
    name: rootPkg?.name ?? basename(root),
    languages: detectLanguages(root, packageDirs, jsDeps),
    packageManager: detectPackageManager(root, rootPkg),
    frameworks: sorted([...pick(JS_FRAMEWORKS, jsDeps.keys()), ...pick(PY_FRAMEWORKS, pyDeps)]),
    monorepo,
    testFrameworks: sorted([
      ...pick(JS_TEST, jsDeps.keys()),
      ...pick(PY_TEST, pyDeps),
      ...(exists(root, "go.mod") ? ["go test"] : []),
      ...(exists(root, "Cargo.toml") ? ["cargo test"] : []),
    ]),
    tooling: sorted([...pick(JS_TOOLING, jsDeps.keys()), ...pick(PY_TOOLING, pyDeps)]),
    ci: detectCi(root),
    deploy: detectDeploy(root, packageDirs),
    scripts,
    envVars: detectEnvVars(root, packageDirs),
    services: [...services.values()].sort((a, b) => a.name.localeCompare(b.name)),
    existingContext: detectExistingContext(root, packageDirs),
  };
  return ContextSchema.parse(context);
}

function detectMonorepo(root: string, pkg: PackageJson | null): Context["monorepo"] {
  const patterns: string[] = [];
  const pnpm = readText(join(root, "pnpm-workspace.yaml"));
  if (pnpm) {
    for (const match of pnpm.matchAll(/^\s*-\s*['"]?([^'"\n#]+?)['"]?\s*$/gm)) {
      patterns.push(match[1]!);
    }
  }
  if (Array.isArray(pkg?.workspaces)) patterns.push(...pkg.workspaces);
  else if (pkg?.workspaces?.packages) patterns.push(...pkg.workspaces.packages);

  let tool: string | null = null;
  if (exists(root, "turbo.json")) tool = "Turborepo";
  else if (exists(root, "nx.json")) tool = "Nx";
  else if (exists(root, "lerna.json")) tool = "Lerna";
  else if (pnpm) tool = "pnpm workspaces";
  else if (patterns.length > 0) tool = "workspaces";

  return { tool, workspaces: sorted(expandWorkspaces(root, patterns)) };
}

/** Supports literal paths and one trailing wildcard segment ("apps/*", "packages/**"). */
function expandWorkspaces(root: string, patterns: string[]): string[] {
  const out: string[] = [];
  for (const raw of patterns) {
    const pattern = raw.trim().replace(/^\.\//, "").replace(/\/$/, "");
    if (!pattern || pattern.startsWith("!")) continue;
    const wildcard = pattern.match(/^(.*?)\/\*\*?$/);
    if (wildcard) {
      const base = wildcard[1]!;
      for (const entry of listDir(join(root, base))) {
        const dir = `${base}/${entry}`;
        if (!entry.startsWith(".") && isDir(join(root, dir)) && hasManifest(join(root, dir))) {
          out.push(dir);
        }
      }
    } else if (!pattern.includes("*") && isDir(join(root, pattern))) {
      out.push(pattern);
    }
  }
  return out;
}

function hasManifest(dir: string): boolean {
  return ["package.json", "pyproject.toml", "go.mod", "Cargo.toml"].some((f) => exists(dir, f));
}

function detectLanguages(root: string, dirs: string[], jsDeps: Map<string, string>): string[] {
  const langs: string[] = [];
  const any = (file: string) => dirs.some((d) => exists(root, d, file));
  if (any("package.json")) {
    langs.push(any("tsconfig.json") || jsDeps.has("typescript") ? "TypeScript" : "JavaScript");
  }
  if (any("pyproject.toml") || any("requirements.txt") || any("setup.py")) langs.push("Python");
  if (any("go.mod")) langs.push("Go");
  if (any("Cargo.toml")) langs.push("Rust");
  if (any("Gemfile")) langs.push("Ruby");
  if (any("composer.json")) langs.push("PHP");
  if (any("pom.xml") || any("build.gradle") || any("build.gradle.kts")) langs.push("Java/Kotlin");
  if (any("Package.swift")) langs.push("Swift");
  return sorted(langs);
}

function detectPackageManager(root: string, pkg: PackageJson | null): string | null {
  if (pkg?.packageManager) return pkg.packageManager.split("@")[0] ?? null;
  const lockfiles: [string, string][] = [
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
    ["uv.lock", "uv"],
    ["poetry.lock", "poetry"],
    ["Pipfile.lock", "pipenv"],
    ["Cargo.lock", "cargo"],
    ["go.sum", "go"],
  ];
  for (const [file, manager] of lockfiles) if (exists(root, file)) return manager;
  if (pkg) return "npm";
  if (exists(root, "requirements.txt")) return "pip";
  return null;
}

export function readPythonDeps(dir: string): string[] {
  const deps: string[] = [];
  const nameOf = (spec: string) =>
    spec.trim().match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/)?.[1]?.toLowerCase();

  for (const file of listDir(dir).filter((f) => /^requirements.*\.txt$/.test(f))) {
    for (const line of (readText(join(dir, file)) ?? "").split("\n")) {
      if (line.trim().startsWith("#") || line.trim().startsWith("-")) continue;
      const name = nameOf(line);
      if (name) deps.push(name);
    }
  }
  const pyproject = readText(join(dir, "pyproject.toml"));
  if (pyproject) {
    let table = "";
    let inDepArray = false;
    for (const line of pyproject.split("\n")) {
      const header = line.match(/^\s*\[+([^\]]+)\]+/);
      if (header) {
        table = header[1]!.trim();
        inDepArray = false;
        continue;
      }
      const depTable = /dependencies|dependency-groups/.test(table);
      // PEP 621: dependencies = ["fastapi>=0.1", ...], possibly spanning lines.
      if (/^\s*(dependencies|[A-Za-z0-9_-]+)\s*=\s*\[/.test(line) && (depTable || /^\s*dependencies\s*=/.test(line))) {
        inDepArray = true;
      }
      if (inDepArray) {
        for (const match of line.matchAll(/["']([^"']+)["']/g)) {
          const name = nameOf(match[1]!);
          if (name) deps.push(name);
        }
        // Extras like "fastapi[standard]" contain "]" inside quotes; only a bare "]" closes the array.
        if (line.replace(/["'][^"']*["']/g, "").includes("]")) inDepArray = false;
        continue;
      }
      // Poetry tables: fastapi = "^0.1"
      const poetry = depTable ? line.match(/^\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*=\s*[{"']/) : null;
      if (poetry && poetry[1] !== "python") deps.push(poetry[1]!.toLowerCase());
    }
  }
  return uniq(deps);
}

function detectCi(root: string): Context["ci"] {
  const ci: Context["ci"] = [];
  for (const file of listDir(join(root, ".github", "workflows")).sort()) {
    if (/\.ya?ml$/.test(file)) ci.push({ provider: "GitHub Actions", file: `.github/workflows/${file}` });
  }
  if (exists(root, ".gitlab-ci.yml")) ci.push({ provider: "GitLab CI", file: ".gitlab-ci.yml" });
  if (exists(root, ".circleci", "config.yml")) {
    ci.push({ provider: "CircleCI", file: ".circleci/config.yml" });
  }
  return ci;
}

function detectDeploy(root: string, dirs: string[]): Context["deploy"] {
  const targets: [string, string][] = [
    ["vercel.json", "Vercel"],
    ["netlify.toml", "Netlify"],
    ["fly.toml", "Fly.io"],
    ["render.yaml", "Render"],
    ["railway.json", "Railway"],
    ["wrangler.toml", "Cloudflare Workers"],
    ["wrangler.jsonc", "Cloudflare Workers"],
    ["app.yaml", "Google App Engine"],
    ["Dockerfile", "Docker"],
    ["docker-compose.yml", "Docker Compose"],
    ["compose.yaml", "Docker Compose"],
  ];
  const out: Context["deploy"] = [];
  for (const dir of dirs) {
    for (const [file, target] of targets) {
      if (exists(root, dir, file)) {
        out.push({ target, file: dir === "." ? file : `${dir}/${file}` });
      }
    }
  }
  return out;
}

const ENV_EXAMPLE_FILES = [".env.example", ".env.sample", ".env.template", ".env.local.example"];
const ENV_SOURCE_PATTERNS = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[["']([A-Z][A-Z0-9_]*)["']\]/g,
  /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
  /Deno\.env\.get\(["']([A-Z][A-Z0-9_]*)["']\)/g,
  /os\.environ(?:\.get\(|\[)["']([A-Z][A-Z0-9_]*)["']/g,
  /os\.getenv\(["']([A-Z][A-Z0-9_]*)["']/g,
];
const IGNORED_ENV = new Set(["NODE_ENV", "CI", "PORT", "HOME", "PATH", "PWD", "DEV", "PROD", "MODE", "SSR"]);

function detectEnvVars(root: string, dirs: string[]): Context["envVars"] {
  const found = new Map<string, Set<string>>();
  const add = (name: string, source: string) => {
    if (IGNORED_ENV.has(name)) return;
    if (!found.has(name)) found.set(name, new Set());
    found.get(name)!.add(source);
  };

  // Example files: names only. Real .env files are never opened.
  for (const dir of dirs) {
    for (const file of ENV_EXAMPLE_FILES) {
      const text = readText(join(root, dir, file));
      if (!text) continue;
      const rel = dir === "." ? file : `${dir}/${file}`;
      for (const match of text.matchAll(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/gm)) {
        add(match[1]!, rel);
      }
    }
  }

  const files = walkFiles(root, {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".py", ".astro", ".vue", ".svelte"],
    maxFiles: 3000,
    maxBytes: 256_000,
  });
  for (const file of files) {
    const text = readText(join(root, file));
    if (!text || !/env/.test(text)) continue;
    for (const pattern of ENV_SOURCE_PATTERNS) {
      for (const match of text.matchAll(pattern)) add(match[1]!, file);
    }
  }

  return [...found.entries()]
    .map(([name, sources]) => ({ name, sources: [...sources].sort().slice(0, 5) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const CONTEXT_FILES = [
  "CLAUDE.md",
  "AGENTS.md",
  "README.md",
  "CONTRIBUTING.md",
  "ARCHITECTURE.md",
  "CONTEXT.md",
  ".cursorrules",
  ".github/copilot-instructions.md",
  "docs",
  "docs/adr",
];

function detectExistingContext(root: string, dirs: string[]): string[] {
  const out: string[] = [];
  for (const dir of dirs) {
    for (const file of CONTEXT_FILES) {
      if (exists(root, dir, file)) out.push(dir === "." ? file : `${dir}/${file}`);
    }
  }
  if (isDir(join(root, ".cursor", "rules"))) out.push(".cursor/rules");
  return out;
}

/** Top-level keys whose values changed between two scans (ignores scannedAt). */
export function diffContext(prev: Context, next: Context): string[] {
  const keys = Object.keys(next) as (keyof Context)[];
  return keys.filter(
    (key) => key !== "scannedAt" && JSON.stringify(prev[key]) !== JSON.stringify(next[key]),
  );
}

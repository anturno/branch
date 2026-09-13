import { describe, expect, it } from "vitest";
import { diffContext, readPythonDeps, scan } from "../src/scanner/index.js";
import { fixture } from "./helpers.js";

const NOW = new Date("2026-09-12T00:00:00Z");

describe("scan", () => {
  it("detects a Next.js app", () => {
    const root = fixture({
      "package.json": {
        name: "shop",
        scripts: { dev: "next dev", test: "vitest run" },
        dependencies: { next: "16.0.0", react: "19.0.0", stripe: "1", "@sentry/nextjs": "1" },
        devDependencies: { typescript: "5", vitest: "5", eslint: "9" },
      },
      "pnpm-lock.yaml": "",
      "tsconfig.json": "{}",
      ".env.example": "STRIPE_SECRET_KEY=\nexport NEXT_PUBLIC_URL=http://x\n# COMMENTED=1\n",
      ".env": "SHOULD_NEVER_BE_READ=secret\n",
      "src/app/api/route.ts": "const k = process.env.STRIPE_SECRET_KEY; const d = process.env['DATABASE_URL']; process.env.NODE_ENV;",
      ".github/workflows/ci.yml": "on: push",
      "vercel.json": "{}",
      "README.md": "# shop",
      "node_modules/x/index.js": "process.env.FROM_NODE_MODULES",
    });

    const c = scan(root, NOW);

    expect(c.name).toBe("shop");
    expect(c.scannedAt).toBe(NOW.toISOString());
    expect(c.languages).toEqual(["TypeScript"]);
    expect(c.packageManager).toBe("pnpm");
    expect(c.frameworks).toEqual(["Next.js", "React"]);
    expect(c.testFrameworks).toEqual(["Vitest"]);
    expect(c.tooling).toEqual(["ESLint", "TypeScript"]);
    expect(c.ci).toEqual([{ provider: "GitHub Actions", file: ".github/workflows/ci.yml" }]);
    expect(c.deploy).toEqual([{ target: "Vercel", file: "vercel.json" }]);
    expect(c.scripts).toEqual({ ".": { dev: "next dev", test: "vitest run" } });
    expect(c.services.map((s) => s.name)).toEqual(["Sentry", "Stripe"]);
    expect(c.envVars).toEqual([
      { name: "DATABASE_URL", sources: ["src/app/api/route.ts"] },
      { name: "NEXT_PUBLIC_URL", sources: [".env.example"] },
      { name: "STRIPE_SECRET_KEY", sources: [".env.example", "src/app/api/route.ts"] },
    ]);
    expect(c.existingContext).toEqual(["README.md"]);
  });

  it("follows workspaces in a monorepo", () => {
    const root = fixture({
      "package.json": { name: "mono", private: true, devDependencies: { turbo: "2" } },
      "pnpm-workspace.yaml": "packages:\n  - 'apps/*'\n  - \"packages/ui\"\n",
      "turbo.json": "{}",
      "apps/web/package.json": {
        name: "web",
        scripts: { dev: "astro dev" },
        dependencies: { astro: "5", "posthog-js": "1" },
      },
      "apps/web/CLAUDE.md": "rules",
      "apps/notes/README.md": "not a package",
      "packages/ui/package.json": { name: "ui", dependencies: { react: "19" } },
    });

    const c = scan(root, NOW);

    expect(c.monorepo).toEqual({ tool: "Turborepo", workspaces: ["apps/web", "packages/ui"] });
    expect(c.frameworks).toEqual(["Astro", "React"]);
    expect(c.scripts).toEqual({ "apps/web": { dev: "astro dev" } });
    expect(c.services).toEqual([{ name: "PostHog", category: "analytics", via: "posthog-js (apps/web)" }]);
    expect(c.existingContext).toEqual(["apps/web/CLAUDE.md"]);
    expect(c.packageManager).toBe("npm");
  });

  it("detects a Python API", () => {
    const root = fixture({
      "pyproject.toml": `[project]
name = "api"
description = "A Django-free service"
dependencies = [
  "fastapi[standard]>=0.115",
  "sqlalchemy>=2",
]

[dependency-groups]
dev = ["pytest>=8", "ruff"]

[build-system]
requires = ["hatchling"]
`,
      "uv.lock": "",
      "app/main.py": "import os\nx = os.environ['DATABASE_URL']\ny = os.getenv(\"OPENAI_API_KEY\")\n",
      "Dockerfile": "FROM python",
    });

    const c = scan(root, NOW);

    expect(c.languages).toEqual(["Python"]);
    expect(c.packageManager).toBe("uv");
    expect(c.frameworks).toEqual(["FastAPI"]);
    expect(c.testFrameworks).toEqual(["pytest"]);
    expect(c.tooling).toEqual(["Ruff"]);
    expect(c.services.map((s) => s.name)).toEqual(["SQLAlchemy"]);
    expect(c.envVars.map((e) => e.name)).toEqual(["DATABASE_URL", "OPENAI_API_KEY"]);
    expect(c.deploy).toEqual([{ target: "Docker", file: "Dockerfile" }]);
  });

  it("reads requirements.txt and poetry tables", () => {
    const root = fixture({
      "requirements.txt": "# web\nDjango==5.0\n-r other.txt\ncelery[redis]>=5\n",
      "pyproject.toml": '[tool.poetry.dependencies]\npython = "^3.12"\nflask = "^3"\n',
    });
    expect(readPythonDeps(root).sort()).toEqual(["celery", "django", "flask"]);
  });

  it("handles an empty directory", () => {
    const c = scan(fixture({}), NOW);
    expect(c.languages).toEqual([]);
    expect(c.packageManager).toBeNull();
    expect(c.monorepo).toEqual({ tool: null, workspaces: [] });
  });
});

describe("diffContext", () => {
  it("ignores the timestamp and reports changed keys", () => {
    const root = fixture({ "package.json": { name: "a", dependencies: { react: "19" } } });
    const a = scan(root, new Date("2026-01-01"));
    const b = scan(root, new Date("2026-02-01"));
    expect(diffContext(a, b)).toEqual([]);

    const c = scan(fixture({ "package.json": { name: "a", dependencies: { vue: "3" } } }), NOW);
    expect(diffContext(a, c)).toEqual(["frameworks"]);
  });
});

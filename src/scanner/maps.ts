/** Dependency name (exact or prefix ending in "/") to framework label. */
export const JS_FRAMEWORKS: Record<string, string> = {
  next: "Next.js",
  "@remix-run/react": "Remix",
  "react-router": "React Router",
  astro: "Astro",
  nuxt: "Nuxt",
  "@sveltejs/kit": "SvelteKit",
  "@angular/core": "Angular",
  "solid-js": "Solid",
  vite: "Vite",
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  "react-native": "React Native",
  expo: "Expo",
  electron: "Electron",
  express: "Express",
  fastify: "Fastify",
  hono: "Hono",
  koa: "Koa",
  "@nestjs/core": "NestJS",
  elysia: "Elysia",
  tailwindcss: "Tailwind CSS",
};

export const PY_FRAMEWORKS: Record<string, string> = {
  fastapi: "FastAPI",
  django: "Django",
  flask: "Flask",
  starlette: "Starlette",
  streamlit: "Streamlit",
};

export const JS_TEST: Record<string, string> = {
  vitest: "Vitest",
  jest: "Jest",
  mocha: "Mocha",
  "@playwright/test": "Playwright",
  cypress: "Cypress",
  "@testing-library/react": "Testing Library",
  "bun-types": "Bun test",
};

export const PY_TEST: Record<string, string> = {
  pytest: "pytest",
  hypothesis: "Hypothesis",
};

export const JS_TOOLING: Record<string, string> = {
  typescript: "TypeScript",
  eslint: "ESLint",
  prettier: "Prettier",
  "@biomejs/biome": "Biome",
  oxlint: "oxlint",
  husky: "Husky",
  "lint-staged": "lint-staged",
  "@changesets/cli": "Changesets",
};

export const PY_TOOLING: Record<string, string> = {
  ruff: "Ruff",
  black: "Black",
  mypy: "mypy",
  pyright: "Pyright",
};

export type ServiceInfo = { name: string; category: string };

/** SDK package (exact, or scope prefix ending in "/") to external service. */
export const SERVICES: Record<string, ServiceInfo> = {
  stripe: { name: "Stripe", category: "payments" },
  "@stripe/": { name: "Stripe", category: "payments" },
  "@lemonsqueezy/": { name: "Lemon Squeezy", category: "payments" },
  "@supabase/": { name: "Supabase", category: "database" },
  firebase: { name: "Firebase", category: "backend" },
  "firebase-admin": { name: "Firebase", category: "backend" },
  "@prisma/client": { name: "Prisma", category: "orm" },
  prisma: { name: "Prisma", category: "orm" },
  "drizzle-orm": { name: "Drizzle", category: "orm" },
  mongoose: { name: "MongoDB", category: "database" },
  mongodb: { name: "MongoDB", category: "database" },
  pg: { name: "PostgreSQL", category: "database" },
  postgres: { name: "PostgreSQL", category: "database" },
  mysql2: { name: "MySQL", category: "database" },
  "better-sqlite3": { name: "SQLite", category: "database" },
  "@libsql/client": { name: "libSQL / Turso", category: "database" },
  "@neondatabase/serverless": { name: "Neon", category: "database" },
  "@planetscale/database": { name: "PlanetScale", category: "database" },
  redis: { name: "Redis", category: "cache" },
  ioredis: { name: "Redis", category: "cache" },
  "@upstash/": { name: "Upstash", category: "cache" },
  "@clerk/": { name: "Clerk", category: "auth" },
  "next-auth": { name: "Auth.js", category: "auth" },
  "@auth/": { name: "Auth.js", category: "auth" },
  "better-auth": { name: "Better Auth", category: "auth" },
  "@workos-inc/": { name: "WorkOS", category: "auth" },
  "posthog-js": { name: "PostHog", category: "analytics" },
  "posthog-node": { name: "PostHog", category: "analytics" },
  "@vercel/analytics": { name: "Vercel Analytics", category: "analytics" },
  "mixpanel-browser": { name: "Mixpanel", category: "analytics" },
  "@sentry/": { name: "Sentry", category: "monitoring" },
  openai: { name: "OpenAI", category: "ai" },
  "@anthropic-ai/sdk": { name: "Anthropic", category: "ai" },
  ai: { name: "Vercel AI SDK", category: "ai" },
  "@ai-sdk/": { name: "Vercel AI SDK", category: "ai" },
  resend: { name: "Resend", category: "email" },
  "@sendgrid/": { name: "SendGrid", category: "email" },
  postmark: { name: "Postmark", category: "email" },
  twilio: { name: "Twilio", category: "messaging" },
  "@aws-sdk/": { name: "AWS", category: "cloud" },
  "@google-cloud/": { name: "Google Cloud", category: "cloud" },
  "@vercel/blob": { name: "Vercel Blob", category: "storage" },
  uploadthing: { name: "UploadThing", category: "storage" },
  algoliasearch: { name: "Algolia", category: "search" },
  "@trigger.dev/": { name: "Trigger.dev", category: "jobs" },
  inngest: { name: "Inngest", category: "jobs" },
  // Python
  "stripe-python": { name: "Stripe", category: "payments" },
  "supabase-py": { name: "Supabase", category: "database" },
  sqlalchemy: { name: "SQLAlchemy", category: "orm" },
  psycopg: { name: "PostgreSQL", category: "database" },
  "psycopg2-binary": { name: "PostgreSQL", category: "database" },
  anthropic: { name: "Anthropic", category: "ai" },
  "sentry-sdk": { name: "Sentry", category: "monitoring" },
  boto3: { name: "AWS", category: "cloud" },
  celery: { name: "Celery", category: "jobs" },
};

export function lookup<T>(map: Record<string, T>, dep: string): T | undefined {
  if (map[dep]) return map[dep];
  for (const key of Object.keys(map)) {
    if (key.endsWith("/") && dep.startsWith(key)) return map[key];
  }
  return undefined;
}

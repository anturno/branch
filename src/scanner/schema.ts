import { z } from "zod";

export const ContextSchema = z.object({
  version: z.literal(1),
  scannedAt: z.string(),
  name: z.string(),
  languages: z.array(z.string()),
  packageManager: z.string().nullable(),
  frameworks: z.array(z.string()),
  monorepo: z.object({
    tool: z.string().nullable(),
    workspaces: z.array(z.string()),
  }),
  testFrameworks: z.array(z.string()),
  tooling: z.array(z.string()),
  ci: z.array(z.object({ provider: z.string(), file: z.string() })),
  deploy: z.array(z.object({ target: z.string(), file: z.string() })),
  /** Scripts per package directory ("." is the root). */
  scripts: z.record(z.string(), z.record(z.string(), z.string())),
  /** Env var names only. Values are never read. */
  envVars: z.array(z.object({ name: z.string(), sources: z.array(z.string()) })),
  services: z.array(z.object({ name: z.string(), category: z.string(), via: z.string() })),
  /** Existing human/agent context files the agent should read first. */
  existingContext: z.array(z.string()),
});

export type Context = z.infer<typeof ContextSchema>;

import { spawn, spawnSync } from "node:child_process";
import type { Layout } from "./paths.js";
import { info } from "./state.js";

const MAX_DEPTH = 2;

export function agentAvailable(bin: string): boolean {
  const result = spawnSync(bin, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

/** Opens the agent in the repo with branch state pre-computed in the system prompt. */
export function launch(l: Layout, prompt: string): Promise<number> {
  const depth = Number.parseInt(process.env.BRANCH_AGENT_DEPTH ?? "0", 10) || 0;
  if (depth >= MAX_DEPTH) {
    throw new Error("branch: refusing to launch an agent from inside a branch agent session.");
  }
  const env = { ...process.env, BRANCH_AGENT_DEPTH: String(depth + 1) };
  const state = [
    "## branch state (pre-computed; do not run shell commands to rediscover it)",
    "<branch-info>",
    JSON.stringify(info(l), null, 2),
    "</branch-info>",
  ].join("\n");

  const [bin, args] =
    l.host === "claude"
      ? ["claude", ["--append-system-prompt", state, prompt]]
      : ["codex", [`${state}\n\n${prompt}`]];

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: l.root, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });
}

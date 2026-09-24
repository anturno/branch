import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** Creates a temp directory from a { path: content } map. Objects are written as JSON. */
export function fixture(files: Record<string, string | object>): string {
  const root = mkdtempSync(join(tmpdir(), "branch-test-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
  return root;
}

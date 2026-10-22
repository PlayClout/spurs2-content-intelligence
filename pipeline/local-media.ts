/** Only app-owned directories are swept. Never recurse through symlinks or scan all of TMPDIR. */
import { readdir, lstat, rm } from "node:fs/promises";
import { resolve, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir, hostname, homedir } from "node:os";

const repo = fileURLToPath(new URL("../", import.meta.url));
export function mediaRoots(): string[] {
  const render = resolve(repo, process.env.RENDER_OUT_DIR ?? "out/renders");
  const roots = [render, resolve(repo, "out/real-proof"), resolve(repo, "out/render-test"), resolve(repo, "out/e2e-renders"), join(tmpdir(), "spursx2-ai")];
  for (const root of roots) {
    if ([resolve(sep), resolve(repo), resolve(homedir()), resolve(tmpdir())].includes(root)) throw new Error(`Unsafe media root: ${root}`);
  }
  return [...new Set(roots)];
}

export async function purgeLocalMedia(opts: { all?: boolean; staleMs?: number; roots?: string[] } = {}) {
  let deleted = 0, filesLeft = 0;
  const cutoff = Date.now() - (opts.staleMs ?? 5 * 60_000);
  async function walk(dir: string) {
    if ((await lstat(dir)).isSymbolicLink()) return;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else {
        const stat = await lstat(file);
        const temporary = entry.name.startsWith("source-") || entry.name.endsWith(".grab.png");
        if (opts.all || (temporary && stat.mtimeMs < cutoff)) { await rm(file, { force: true }); deleted++; }
        else filesLeft++;
      }
    }
  }
  for (const root of opts.roots ?? mediaRoots()) {
    try { await walk(root); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
  }
  return { laptop: hostname(), timestamp: new Date().toISOString(), deleted, files_left: filesLeft };
}

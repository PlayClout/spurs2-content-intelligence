/**
 * Vercel preview deploy for nova/architecture (replay mode: MOCK_MODE=1).
 * Reads token/teamId + Supabase creds from the local workspace credential store —
 * secrets never touch the repo, argv, or shell. Configures project (root=web/,
 * Next.js), upserts env vars, then runs `npx vercel deploy` with VERCEL_TOKEN env.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const CRED = (p) => JSON.parse(readFileSync(p, "utf8"));
const vercel = CRED("/Users/stu/.openclaw/workspace/memory/credentials/vercel/clout-fullscope.json");
const supa = CRED("/Users/stu/.openclaw/workspace/memory/credentials/supabase/spurs2.json");

const PROJECT_ID = "prj_WIeFwD8J5KM8cJyKJ5FJiUfq1ht6";
const token = vercel.token;
const teamId = vercel.teamId;
const dbUrl = `postgresql://postgres.${supa.projectRef}:${encodeURIComponent(supa.dbPass)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${teamId}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
};

// 1. Project settings: root directory web/, framework nextjs
const patch = await api(`/v9/projects/${PROJECT_ID}`, {
  method: "PATCH",
  // installCommand also installs repo-root deps: shared/*.ts (outside web/) resolves
  // node_modules upward from the repo root, which Vercel otherwise never populates.
  body: JSON.stringify({ rootDirectory: "web", framework: "nextjs", installCommand: "npm install && npm install --prefix .." }),
});
console.log(`project settings: ${patch.status} root=${patch.body.rootDirectory} framework=${patch.body.framework}`);

// 2. Upsert env vars (preview + production)
for (const [key, value] of [["DATABASE_URL", dbUrl], ["MOCK_MODE", "1"]]) {
  const r = await api(`/v10/projects/${PROJECT_ID}/env?upsert=true`, {
    method: "POST",
    body: JSON.stringify({ key, value, type: "encrypted", target: ["preview", "production"] }),
  });
  console.log(`env ${key}: ${r.status}${r.status >= 400 ? " " + JSON.stringify(r.body).slice(0, 200) : ""}`);
}

// 3. Link + deploy from repo root (CLI uploads whole repo; build runs in web/)
mkdirSync(".vercel", { recursive: true });
writeFileSync(".vercel/project.json", JSON.stringify({ projectId: PROJECT_ID, orgId: teamId }));
const r = spawnSync("npx", ["vercel", "deploy", "--yes"], {
  env: { ...process.env, VERCEL_TOKEN: token, VERCEL_ORG_ID: teamId, VERCEL_PROJECT_ID: PROJECT_ID },
  stdio: ["ignore", "pipe", "pipe"],
  encoding: "utf8",
  timeout: 15 * 60 * 1000,
});
console.log(r.stdout);
console.error(r.stderr?.slice(-3000));
if (r.status !== 0) process.exit(r.status ?? 1);

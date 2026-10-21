import { readFileSync } from "node:fs";
const v = JSON.parse(readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/vercel/clout-fullscope.json", "utf8"));
const H = { Authorization: `Bearer ${v.token}` };
const PROJECT_ID = "prj_WIeFwD8J5KM8cJyKJ5FJiUfq1ht6";
const dep = await (await fetch(`https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&limit=1&teamId=${v.teamId}`, { headers: H })).json();
const d = dep.deployments[0];
console.log(d.uid, d.state, d.url);
const ev = await (await fetch(`https://api.vercel.com/v3/deployments/${d.uid}/events?teamId=${v.teamId}&limit=200`, { headers: H })).json();
for (const e of ev) if (e.payload?.text) console.log(e.payload.text);

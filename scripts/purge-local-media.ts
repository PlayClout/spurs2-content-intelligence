import { purgeLocalMedia } from "../pipeline/local-media";
const result = await purgeLocalMedia({ all: process.argv.includes("--all") });
console.log(JSON.stringify(result), `files_left=${result.files_left}`);
if (process.argv.includes("--all") && result.files_left) process.exitCode = 1;

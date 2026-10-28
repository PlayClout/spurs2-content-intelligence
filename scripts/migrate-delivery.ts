// Additive migration: opportunities.delivery jsonb (nullable). Idempotent. Run: npx tsx --env-file=.env scripts/migrate-delivery.ts
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
await sql`alter table opportunities add column if not exists delivery jsonb`;
const cols = await sql`select column_name, data_type, is_nullable from information_schema.columns where table_name = 'opportunities' and column_name = 'delivery'`;
console.log(cols.length ? `OK opportunities.delivery ${cols[0].data_type} nullable=${cols[0].is_nullable}` : "MISSING");
await sql.end();
process.exit(cols.length ? 0 : 1);

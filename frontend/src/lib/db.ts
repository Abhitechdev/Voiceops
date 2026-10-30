import postgres from "postgres";

// Supabase Transaction Pooler (Port 6543) is optimized for serverless/edge environments
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.uskhvfuvuodjjysxiuqj:Abhi12%2334567890@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require";

declare global {
  // eslint-disable-next-line no-var
  var __voiceops_sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  globalThis.__voiceops_sql ||
  postgres(connectionString, {
    ssl: "require",
    max: 2,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false, // Required for Supabase transaction pooler (port 6543)
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__voiceops_sql = sql;
}

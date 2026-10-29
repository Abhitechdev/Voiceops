import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.uskhvfuvuodjjysxiuqj:Abhi12%2334567890@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require";

declare global {
  // eslint-disable-next-line no-var
  var __voiceops_sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  globalThis.__voiceops_sql ||
  postgres(connectionString, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__voiceops_sql = sql;
}


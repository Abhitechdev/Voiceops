import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const start = Date.now();
    await sql`SELECT 1;`;
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      service: "voiceops-nextjs-api",
      database: "connected (Supabase PostgreSQL)",
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        database_error: error.message,
      },
      { status: 500 }
    );
  }
}

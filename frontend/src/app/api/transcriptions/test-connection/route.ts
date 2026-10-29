import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey =
    process.env.GNANI_API_KEY ||
    "vach_1ytE2CY5X2DTeVZrAmBPAeUypWsZVrRl8eXvcE5fqseJNGTtRhRQP8JDEXM2NzxZ7YsPYQcyGIXixH1dOwa7wRca6HnmlJHa_eacd2bc7432795a4224a147eb8ae325e";
  const endpoint =
    process.env.GNANI_API_ENDPOINT || "https://api.vachana.ai/stt/v3";

  if (!apiKey) {
    return NextResponse.json({
      connected: false,
      message: "GNANI_API_KEY is not configured.",
    });
  }

  const start = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: "OPTIONS",
      headers: {
        "X-API-Key-ID": apiKey,
      },
    });
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      connected: res.status < 500,
      status_code: res.status,
      latency_ms: latencyMs,
      provider: "Gnani AI (Prisma v3)",
      message: "Successfully reached Gnani AI STT endpoint.",
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      latency_ms: Date.now() - start,
      message: `Failed to connect: ${error.message}`,
    });
  }
}


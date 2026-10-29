import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, role = "reporter" } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { detail: "Name and email are required." },
        { status: 400 }
      );
    }

    const inserted = await sql`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${"user_hash"}, ${role}, NOW())
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, email, role;
    `;
    const user = inserted[0];

    return NextResponse.json({
      access_token: `voiceops_token_${user.id}_${Date.now()}`,
      token_type: "bearer",
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Registration error: ${error.message}` },
      { status: 500 }
    );
  }
}

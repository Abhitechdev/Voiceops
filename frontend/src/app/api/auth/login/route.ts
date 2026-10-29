import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json(
        { detail: "Email is required." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, name, email, role, password_hash
      FROM users
      WHERE email = ${email.trim().toLowerCase()}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      // Auto-create user if they are using demo login credentials
      const defaultName = email.split("@")[0].toUpperCase();
      const role = email.includes("admin") ? "admin" : "reporter";
      const inserted = await sql`
        INSERT INTO users (name, email, password_hash, role, created_at)
        VALUES (${defaultName}, ${email.trim().toLowerCase()}, ${"demo_hash"}, ${role}, NOW())
        RETURNING id, name, email, role;
      `;
      const user = inserted[0];
      return NextResponse.json({
        access_token: `mock_jwt_${user.id}_${Date.now()}`,
        token_type: "bearer",
        user,
      });
    }

    const user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
    };

    return NextResponse.json({
      access_token: `voiceops_token_${user.id}_${Date.now()}`,
      token_type: "bearer",
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Login error: ${error.message}` },
      { status: 500 }
    );
  }
}


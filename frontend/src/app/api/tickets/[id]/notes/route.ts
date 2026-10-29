import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ident = params.id.trim();
    const body = await req.json();
    const { note, author_name = "Field Technician" } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { detail: "Note text is required." },
        { status: 400 }
      );
    }

    // Lookup ticket
    const isNum = /^\d+$/.test(ident);
    const existing = isNum
      ? await sql`SELECT id FROM tickets WHERE id = ${parseInt(ident, 10)} LIMIT 1;`
      : await sql`SELECT id FROM tickets WHERE ticket_number ILIKE ${ident} LIMIT 1;`;

    if (existing.length === 0) {
      return NextResponse.json(
        { detail: `Ticket '${ident}' not found.` },
        { status: 404 }
      );
    }

    const ticketId = existing[0].id;

    const inserted = await sql`
      INSERT INTO ticket_notes (ticket_id, author_name, note, created_at)
      VALUES (${ticketId}, ${author_name}, ${note.trim()}, NOW())
      RETURNING *;
    `;

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Failed to add note: ${error.message}` },
      { status: 500 }
    );
  }
}


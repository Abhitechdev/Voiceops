import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ident = params.id.trim();

    // Query ticket by ticket_number or integer id
    const isNum = /^\d+$/.test(ident);
    const tickets = isNum
      ? await sql`SELECT * FROM tickets WHERE id = ${parseInt(ident, 10)} LIMIT 1;`
      : await sql`SELECT * FROM tickets WHERE ticket_number ILIKE ${ident} LIMIT 1;`;

    if (tickets.length === 0) {
      return NextResponse.json(
        { detail: `Ticket '${ident}' not found.` },
        { status: 400 }
      );
    }

    const ticket = tickets[0];

    // Fetch related history
    const history = await sql`
      SELECT id, ticket_id, actor_id, actor_name, action, previous_value, new_value, created_at
      FROM ticket_history
      WHERE ticket_id = ${ticket.id}
      ORDER BY created_at DESC;
    `;

    // Fetch related notes
    const notes = await sql`
      SELECT id, ticket_id, author_id, author_name, note, created_at
      FROM ticket_notes
      WHERE ticket_id = ${ticket.id}
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({
      ...ticket,
      history,
      notes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Error loading ticket: ${error.message}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ident = params.id.trim();
    const body = await req.json();
    const { status, resolution_notes, actor_name = "Administrator" } = body;

    if (!status) {
      return NextResponse.json(
        { detail: "New status is required." },
        { status: 400 }
      );
    }

    // Lookup ticket
    const isNum = /^\d+$/.test(ident);
    const existing = isNum
      ? await sql`SELECT id, ticket_number, status FROM tickets WHERE id = ${parseInt(ident, 10)} LIMIT 1;`
      : await sql`SELECT id, ticket_number, status FROM tickets WHERE ticket_number ILIKE ${ident} LIMIT 1;`;

    if (existing.length === 0) {
      return NextResponse.json(
        { detail: `Ticket '${ident}' not found.` },
        { status: 404 }
      );
    }

    const ticket = existing[0];
    const oldStatus = ticket.status;
    const isResolving = status.toLowerCase() === "resolved";

    // Update status
    const updated = await sql`
      UPDATE tickets
      SET status = ${status},
          resolution_notes = COALESCE(${resolution_notes ? resolution_notes.trim() : null}, resolution_notes),
          updated_at = NOW(),
          resolved_at = CASE WHEN ${isResolving} THEN NOW() ELSE resolved_at END
      WHERE id = ${ticket.id}
      RETURNING *;
    `;

    // Append history
    await sql`
      INSERT INTO ticket_history (ticket_id, actor_name, action, previous_value, new_value, created_at)
      VALUES (
        ${ticket.id},
        ${actor_name},
        ${"status_change"},
        ${oldStatus},
        ${`Status changed to '${status}'. ${resolution_notes ? `Note: ${resolution_notes}` : ""}`},
        NOW()
      );
    `;

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Failed to update status: ${error.message}` },
      { status: 500 }
    );
  }
}

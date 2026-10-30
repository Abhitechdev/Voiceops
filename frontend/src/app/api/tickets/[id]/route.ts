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
        { status: 404 }
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ident = params.id.trim();
    const body = await req.json();
    const {
      status,
      priority,
      category,
      location,
      resolution_notes,
      assigned_to,
      assignee_name,
      title,
      description,
      actor_name = "Campus Staff",
    } = body;

    // Lookup existing ticket
    const isNum = /^\d+$/.test(ident);
    const existing = isNum
      ? await sql`SELECT id, ticket_number, status, priority FROM tickets WHERE id = ${parseInt(ident, 10)} LIMIT 1;`
      : await sql`SELECT id, ticket_number, status, priority FROM tickets WHERE ticket_number ILIKE ${ident} LIMIT 1;`;

    if (existing.length === 0) {
      return NextResponse.json(
        { detail: `Ticket '${ident}' not found.` },
        { status: 404 }
      );
    }

    const ticket = existing[0];
    const prevStatus = ticket.status;
    const isResolving = status && status.toLowerCase() === "resolved";

    // Perform updates
    const updated = await sql`
      UPDATE tickets
      SET
        status = COALESCE(${status || null}, status),
        priority = COALESCE(${priority || null}, priority),
        category = COALESCE(${category || null}, category),
        location = COALESCE(${location || null}, location),
        title = COALESCE(${title || null}, title),
        description = COALESCE(${description || null}, description),
        assigned_to = COALESCE(${assigned_to !== undefined ? assigned_to : null}, assigned_to),
        assignee_name = COALESCE(${assignee_name || null}, assignee_name),
        resolution_notes = COALESCE(${resolution_notes !== undefined ? resolution_notes : null}, resolution_notes),
        resolved_at = CASE WHEN ${isResolving ? 1 : 0} = 1 THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
      WHERE id = ${ticket.id}
      RETURNING *;
    `;

    // Record audit trail in ticket_history
    const actionDesc = status && status !== prevStatus
      ? `Status changed from '${prevStatus}' to '${status}'.`
      : priority && priority !== ticket.priority
      ? `Priority changed to '${priority}'.`
      : resolution_notes
      ? `Resolution notes recorded: ${resolution_notes}`
      : `Ticket details updated.`;

    await sql`
      INSERT INTO ticket_history (ticket_id, actor_name, action, previous_value, new_value, created_at)
      VALUES (
        ${ticket.id},
        ${actor_name},
        ${status && status !== prevStatus ? "status_change" : "ticket_update"},
        ${prevStatus},
        ${actionDesc},
        NOW()
      );
    `;

    // Fetch refreshed history and notes
    const history = await sql`
      SELECT id, ticket_id, actor_id, actor_name, action, previous_value, new_value, created_at
      FROM ticket_history
      WHERE ticket_id = ${ticket.id}
      ORDER BY created_at DESC;
    `;

    const notes = await sql`
      SELECT id, ticket_id, author_id, author_name, note, created_at
      FROM ticket_notes
      WHERE ticket_id = ${ticket.id}
      ORDER BY created_at DESC;
    `;

    return NextResponse.json({
      ...updated[0],
      history,
      notes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Failed to update ticket: ${error.message}` },
      { status: 500 }
    );
  }
}

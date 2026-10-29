import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Build conditions
    let query = sql`
      SELECT id, ticket_number, title, description, category, location, priority, status,
             assigned_to, assignee_name, resolution_notes, created_at, updated_at, resolved_at
      FROM tickets
      WHERE 1=1
    `;

    if (status && status !== "All") {
      query = sql`${query} AND status ILIKE ${status}`;
    }
    if (category && category !== "All") {
      query = sql`${query} AND category ILIKE ${category}`;
    }
    if (priority && priority !== "All") {
      query = sql`${query} AND priority ILIKE ${priority}`;
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = sql`${query} AND (
        ticket_number ILIKE ${term} OR
        title ILIKE ${term} OR
        description ILIKE ${term} OR
        location ILIKE ${term}
      )`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;

    const tickets = await query;
    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Failed to fetch tickets: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      transcript_original,
      transcript_reviewed,
      category = "Other",
      location,
      priority = "Medium",
    } = body;

    if (!title || !description || !transcript_reviewed) {
      return NextResponse.json(
        { detail: "Title, description, and reviewed transcript are required." },
        { status: 400 }
      );
    }

    // 1. Idempotency Check (prevent duplicates within 90 seconds)
    const recentDuplicate = await sql`
      SELECT id, ticket_number, title, status, created_at
      FROM tickets
      WHERE title = ${title.trim()}
        AND created_at >= NOW() - INTERVAL '90 seconds'
      LIMIT 1;
    `;
    if (recentDuplicate.length > 0) {
      return NextResponse.json(recentDuplicate[0]);
    }

    // 2. Generate Next Sequential Number
    const lastRow = await sql`
      SELECT ticket_number, id FROM tickets ORDER BY id DESC LIMIT 1;
    `;
    let nextNum = "VO-1001";
    if (lastRow.length > 0 && lastRow[0].ticket_number) {
      const match = lastRow[0].ticket_number.match(/VO-(\d+)/);
      if (match) {
        nextNum = `VO-${parseInt(match[1], 10) + 1}`;
      } else {
        nextNum = `VO-${1000 + lastRow[0].id + 1}`;
      }
    }

    // 3. Insert Ticket
    const inserted = await sql`
      INSERT INTO tickets (
        ticket_number, title, description, transcript_original, transcript_reviewed,
        category, location, priority, status, reporter_name, created_at, updated_at
      )
      VALUES (
        ${nextNum}, ${title.trim()}, ${description.trim()}, ${transcript_original || null},
        ${transcript_reviewed.trim()}, ${category}, ${location ? location.trim() : null},
        ${priority}, ${"Open"}, ${"Web Reporter"}, NOW(), NOW()
      )
      RETURNING *;
    `;
    const newTicket = inserted[0];

    // 4. Insert Audit History
    await sql`
      INSERT INTO ticket_history (ticket_id, actor_name, action, new_value, created_at)
      VALUES (
        ${newTicket.id},
        ${"Web Reporter"},
        ${"created"},
        ${`Ticket created with status 'Open' and priority '${priority}'.`},
        NOW()
      );
    `;

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Failed to create ticket: ${error.message}` },
      { status: 500 }
    );
  }
}


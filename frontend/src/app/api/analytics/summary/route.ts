import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slaHours = parseInt(searchParams.get("sla_hours") || "48", 10);

    // 1. Total & Status Counts
    const statusCounts = await sql`
      SELECT status, COUNT(*)::int as count
      FROM tickets
      GROUP BY status;
    `;
    const statusMap: Record<string, number> = {};
    let totalTickets = 0;
    for (const row of statusCounts) {
      statusMap[row.status] = row.count;
      totalTickets += row.count;
    }

    const openTickets = statusMap["Open"] || 0;
    const inProgressTickets = statusMap["In Progress"] || 0;
    const resolvedTickets = statusMap["Resolved"] || 0;
    const closedTickets = statusMap["Closed"] || 0;

    // 2. SLA Overdue
    const overdueResult = await sql`
      SELECT COUNT(*)::int as count
      FROM tickets
      WHERE status IN ('Open', 'In Progress')
        AND created_at < NOW() - (${slaHours} || ' hours')::interval;
    `;
    const overdueTickets = overdueResult[0]?.count || 0;

    // 3. Average Resolution Time (Hours)
    const avgDurationResult = await sql`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) as avg_hours
      FROM tickets
      WHERE resolved_at IS NOT NULL;
    `;
    const rawAvg = avgDurationResult[0]?.avg_hours;
    const avgResolutionHours = rawAvg ? Math.round(Number(rawAvg) * 10) / 10 : 0.0;

    // 4. By Category
    const categoryRows = await sql`
      SELECT category, COUNT(*)::int as count
      FROM tickets
      GROUP BY category
      ORDER BY count DESC;
    `;

    // 5. By Priority
    const priorityRows = await sql`
      SELECT priority, COUNT(*)::int as count
      FROM tickets
      GROUP BY priority
      ORDER BY count DESC;
    `;

    // 6. By Top Locations
    const locationRows = await sql`
      SELECT location, COUNT(*)::int as count
      FROM tickets
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 6;
    `;

    // 7. 7-Day Trend
    const trendRows = await sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*)::int as count
      FROM tickets
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC;
    `;

    // Initialize 7 days
    const trendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      trendMap[dateStr] = 0;
    }
    for (const row of trendRows) {
      if (row.date in trendMap) {
        trendMap[row.date] = row.count;
      }
    }
    const trendOverTime = Object.entries(trendMap).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      total_tickets: totalTickets,
      open_tickets: openTickets,
      in_progress_tickets: inProgressTickets,
      resolved_tickets: resolvedTickets,
      closed_tickets: closedTickets,
      overdue_tickets: overdueTickets,
      avg_resolution_hours: avgResolutionHours,
      by_category: categoryRows,
      by_priority: priorityRows,
      by_location: locationRows,
      trend_over_time: trendOverTime,
      sla_target_hours: slaHours,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Analytics error: ${error.message}` },
      { status: 500 }
    );
  }
}

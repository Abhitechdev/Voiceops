"""
VoiceOps — Voice-First Issue Reporting and Management System
Hugging Face Space Gradio Application
"""

import os
import pandas as pd
import gradio as gr
from dotenv import load_dotenv

load_dotenv()

from services.db import init_db, check_db_health, get_db, Ticket
from services.transcription import (
    transcription_service,
    SAMPLE_EVALUATION_TRANSCRIPTS,
    ALLOWED_AUDIO_EXTENSIONS,
)
from services.extraction import extraction_service
from services.ticket_service import ticket_service
from services.analytics import analytics_service
from services.supabase_service import supabase_service
from schemas.issues import TicketCreate, TicketCategory, TicketPriority, TicketStatus

# Ensure database tables exist on startup
try:
    init_db()
except Exception as e:
    print(f"Warning during DB init: {e}")


# ==============================================================================
# Helper Functions for Gradio Workflows
# ==============================================================================

def on_transcribe(audio_file, language_choice):
    """Handle audio upload/recording and transcribe via Gnani AI."""
    if not audio_file:
        return "", gr.Warning("Please record audio or upload a sound file first.")

    try:
        lang_code = "te-IN" if "Telugu" in language_choice else "hi-IN" if "Hindi" in language_choice else "en-IN"
        result = transcription_service.transcribe(audio_file, language=lang_code)
        transcript = result.get("transcript", "")
        provider = result.get("provider", "Gnani AI")
        conf = round(result.get("confidence", 0.9) * 100, 1)
        info_msg = f"✓ {provider} ({conf}% confidence)"
        return transcript, info_msg
    except Exception as exc:
        return "", f"❌ Transcription Error: {str(exc)}"


def on_load_preset(preset_idx):
    """Load pre-recorded sample transcript for immediate evaluation."""
    try:
        sample = SAMPLE_EVALUATION_TRANSCRIPTS[int(preset_idx)]
        return sample["transcript"], f"✓ Loaded Preset: {sample['note']}"
    except Exception:
        return "", ""


def on_extract(transcript_text, language_choice):
    """Parse structured fields from transcript."""
    if not transcript_text or not transcript_text.strip():
        raise gr.Error("Cannot extract fields: Transcript buffer is empty. Record or enter speech text.")

    lang_code = "te-IN" if "Telugu" in language_choice else "hi-IN" if "Hindi" in language_choice else "en-IN"
    result = extraction_service.extract(transcript_text, language=lang_code)

    warning_text = ""
    if "location" in result.missing_fields:
        warning_text = "⚠️ Notice: Campus location could not be identified automatically. Please specify the room/building below."

    return (
        result.title,
        result.category,
        result.location or "",
        result.priority,
        result.asset_id or "",
        result.description,
        f"Confidence: {round(result.confidence * 100, 1)}% | {result.reasoning}",
        warning_text,
    )


def on_submit_ticket(title, category, location, priority, asset_id, description, original_transcript, reviewed_transcript):
    """Create persistent ticket in Supabase PostgreSQL."""
    if not title or not title.strip():
        raise gr.Error("Work Order Title is mandatory.")
    if not description or not description.strip():
        raise gr.Error("Incident Description is mandatory.")
    if not location or not location.strip():
        raise gr.Error("Campus Location is mandatory to dispatch field technicians.")

    try:
        ticket_in = TicketCreate(
            title=title.strip(),
            category=category,
            location=location.strip(),
            priority=priority,
            asset_id=asset_id.strip() if asset_id else None,
            description=description.strip(),
            transcript_original=original_transcript if original_transcript else reviewed_transcript,
            transcript_reviewed=reviewed_transcript.strip(),
        )

        db = next(get_db())
        created = ticket_service.create_ticket(db, ticket_in, reporter_name="Campus Reporter")

        success_md = f"""
### 🎉 Ticket Dispatched Successfully!
- **Ticket ID**: `{created.ticket_number}`
- **Domain**: {created.category}
- **Location**: {created.location}
- **Priority**: {created.priority}
- **Status**: {created.status}
- **Indexed in**: Supabase PostgreSQL

*You can now track this work order under the **Ticket Register** tab.*
"""
        return success_md, created.ticket_number
    except Exception as exc:
        raise gr.Error(f"Database error: {str(exc)}")


def on_load_tickets_dataframe(search_term, status_filter, category_filter, priority_filter):
    """Query tickets from database and return as pandas DataFrame."""
    try:
        db = next(get_db())
        tickets = ticket_service.list_tickets(
            db,
            status=status_filter,
            category=category_filter,
            priority=priority_filter,
            search=search_term,
            limit=100,
        )

        rows = []
        for t in tickets:
            rows.append({
                "Ticket ID": t.ticket_number,
                "Title": t.title,
                "Category": t.category,
                "Campus Location": t.location or "Pending",
                "Priority": t.priority,
                "Status": t.status,
                "Created At": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "",
            })

        if not rows:
            return pd.DataFrame(columns=["Ticket ID", "Title", "Category", "Campus Location", "Priority", "Status", "Created At"])

        return pd.DataFrame(rows)
    except Exception as exc:
        print(f"Error loading tickets: {exc}")
        return pd.DataFrame()


def on_get_ticket_details(ticket_id):
    """Retrieve full details, audio evidence, and history for a ticket."""
    if not ticket_id or not str(ticket_id).strip():
        return "Select or enter a Ticket ID (e.g. VO-1001)", "", "", "", "", "", "Open", ""

    try:
        db = next(get_db())
        t = ticket_service.get_ticket(db, str(ticket_id).strip())
        if not t:
            return f"❌ Ticket '{ticket_id}' not found.", "", "", "", "", "", "Open", ""

        header_md = f"### [{t.ticket_number}] {t.title}\n**Reporter:** {t.reporter_name or 'Reporter'} | **Created:** {t.created_at.strftime('%Y-%m-%d %H:%M') if t.created_at else ''}"
        desc_md = f"**Problem Description:**\n{t.description}"
        location_info = f"📍 Location: {t.location or 'Pending'} | 🏷️ Domain: {t.category} | ⚡ Priority: {t.priority}"

        transcript_md = ""
        if t.transcript_reviewed:
            transcript_md = f"**Spoken Transcript:**\n*\"{t.transcript_reviewed}\"*"
            if t.transcript_original and t.transcript_original != t.transcript_reviewed:
                transcript_md += f"\n\n*Raw Initial Speech:* \"{t.transcript_original}\""
        else:
            transcript_md = "*No speech transcript associated with this ticket.*"

        # Build Audit History & Notes string
        history_lines = ["#### 📜 Activity Audit Trail & Technician Log:"]
        if t.notes:
            for n in t.notes:
                history_lines.append(f"- 💬 **{n.author_name}** ({n.created_at.strftime('%m-%d %H:%M')}): {n.note}")

        if t.history:
            for h in t.history:
                history_lines.append(f"- ⚙️ **{h.action}** by {h.actor_name or 'System'} ({h.created_at.strftime('%m-%d %H:%M')}): {h.new_value or ''}")

        if not t.notes and not t.history:
            history_lines.append("- *No log entries recorded yet.*")

        log_md = "\n".join(history_lines)
        return header_md, desc_md, location_info, transcript_md, log_md, t.status, t.resolution_notes or ""
    except Exception as exc:
        return f"Error retrieving ticket: {str(exc)}", "", "", "", "", "Open", ""


def on_update_status(ticket_id, new_status, resolution_notes):
    """Commit ticket status transition to database."""
    if not ticket_id or not str(ticket_id).strip():
        raise gr.Error("Please specify a Ticket ID to update.")

    try:
        db = next(get_db())
        updated = ticket_service.update_ticket_status(
            db,
            ticket_number=str(ticket_id).strip(),
            new_status=new_status,
            resolution_notes=resolution_notes,
            actor_name="Administrator",
        )
        return f"✓ Status updated to '{updated.status}' successfully.", updated.status
    except Exception as exc:
        raise gr.Error(f"Failed to update status: {str(exc)}")


def on_add_technician_note(ticket_id, note_text):
    """Append technician note."""
    if not ticket_id or not note_text or not note_text.strip():
        raise gr.Error("Ticket ID and note text are required.")

    try:
        db = next(get_db())
        ticket_service.add_note(db, ticket_number=str(ticket_id).strip(), note_text=note_text.strip())
        return "✓ Technician note appended to work order log.", ""
    except Exception as exc:
        raise gr.Error(f"Failed to log note: {str(exc)}")


def on_get_analytics(sla_hours):
    """Generate real-time analytics data from persistent Supabase database."""
    try:
        db = next(get_db())
        summary = analytics_service.get_summary(db, sla_hours=int(sla_hours))

        # KPI markdown string
        kpi_md = f"""
| 📦 Total Work Orders | ⏳ Pending Triage | 🛠️ In Active Fix | ✅ Resolved / Closed | 🚨 SLA Overdue | ⏱️ Mean Turnaround |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **{summary['total_tickets']}** | **{summary['open_tickets']}** | **{summary['in_progress_tickets']}** | **{summary['resolved_tickets'] + summary['closed_tickets']}** | **{summary['overdue_tickets']}** | **{summary['avg_resolution_hours']}h** |
"""
        # Category dataframe
        cat_df = pd.DataFrame(summary["by_category"])
        if cat_df.empty:
            cat_df = pd.DataFrame(columns=["category", "count"])

        # Priority dataframe
        pri_df = pd.DataFrame(summary["by_priority"])
        if pri_df.empty:
            pri_df = pd.DataFrame(columns=["priority", "count"])

        # Trend dataframe
        trend_df = pd.DataFrame(summary["trend_over_time"])
        if trend_df.empty:
            trend_df = pd.DataFrame(columns=["date", "count"])

        # Locations text
        loc_str = "\n".join([f"- **{loc['location']}**: {loc['count']} incidents" for loc in summary["by_location"]])
        if not loc_str:
            loc_str = "*No location data recorded yet.*"

        return kpi_md, cat_df, pri_df, trend_df, loc_str
    except Exception as exc:
        return f"Error loading analytics: {exc}", pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), ""


def on_ping_gnani():
    """Execute live diagnostic ping to Gnani AI endpoint."""
    res = transcription_service.test_connection()
    status_icon = "🟢" if res["connected"] else "🔴"
    return f"{status_icon} **{res.get('message', '')}**\n- Latency: `{res.get('latency_ms', 0)}ms`\n- Model: `{res.get('model', 'prisma-v2.5')}`"


def on_check_supabase():
    """Verify live Supabase PostgreSQL connection."""
    health = check_db_health()
    info = supabase_service.get_connection_info()
    counts = supabase_service.get_table_counts()
    status_icon = "🟢" if health["connected"] else "🔴"

    return f"""
{status_icon} **Database Connection:** `{health.get('status', 'unknown').upper()}`
- **Provider:** {info['provider']} ({info['dialect']})
- **Host:** `{info['host']}`
- **Latency:** `{health.get('latency_ms', 0)}ms`
- **Current Live Records:** {counts['tickets']} tickets, {counts['users']} users, {counts['history']} history logs, {counts['notes']} notes
"""


# ==============================================================================
# Gradio Blocks Application Layout
# ==============================================================================

custom_css = """
.gradio-container {
    max-width: 1200px !important;
    margin: auto !important;
}
.kpi-table table {
    width: 100%;
    text-align: center;
}
.kpi-table th, .kpi-table td {
    padding: 12px 16px !important;
    font-size: 15px !important;
}
"""

with gr.Blocks(title="VoiceOps — Voice-First Issue Management", css=custom_css, theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
        # 🎙️ VoiceOps — Voice-First Issue Reporting & Operational Management
        ### Enterprise Speech-to-Text via **Gnani AI** • Persistent Storage in **Supabase PostgreSQL**
        *Capture spoken field reports in Telugu, Indian English, or code-mixed speech, verify transcripts, and dispatch to campus technicians.*
        """
    )

    with gr.Tabs() as tabs:
        # ======================================================================
        # Tab 1: Report an Issue
        # ======================================================================
        with gr.Tab("🎙️ Report an Issue", id="tab_report"):
            gr.Markdown("#### Step 1: Acoustic Capture & Language Selection")
            with gr.Row():
                with gr.Column(scale=6):
                    audio_input = gr.Audio(
                        sources=["microphone", "upload"],
                        type="filepath",
                        label="Record Voice Complaint or Upload Audio File (WAV, MP3, WEBM, M4A)",
                    )
                    language_selector = gr.Radio(
                        choices=["Telugu (తెలుగు - te-IN)", "Indian English (en-IN)", "Hindi (हिन्दी - hi-IN)"],
                        value="Telugu (తెలుగు - te-IN)",
                        label="Target Speech Recognition Language",
                    )
                    transcribe_btn = gr.Button("🎙️ Transcribe Audio with Gnani AI", variant="primary")
                    transcribe_info = gr.Markdown()

                with gr.Column(scale=4):
                    gr.Markdown("##### ⚡ Instant Evaluation Presets (Test without a Mic)")
                    preset_buttons = [
                        gr.Button("1. Projector Cable Issue (Code-Mixed Telugu)", size="sm"),
                        gr.Button("2. Lab Internet Down (Pure Telugu)", size="sm"),
                        gr.Button("3. Lab 3 Network Down (Indian English)", size="sm"),
                        gr.Button("4. Power Socket Spark Hazard (English)", size="sm"),
                        gr.Button("5. Water Leakage 2nd Floor (English)", size="sm"),
                    ]

            gr.Markdown("#### Step 2: Human-in-the-Loop Transcript Review")
            with gr.Row():
                with gr.Column():
                    raw_transcript_cache = gr.Textbox(visible=False)
                    transcript_box = gr.Textbox(
                        lines=3,
                        placeholder="Transcript will appear here. Edit any words that were misrecognized before extracting...",
                        label="Reviewed Transcript (Editable)",
                    )
                    extract_btn = gr.Button("🔍 Extract Structured Issue Fields", variant="secondary")

            gr.Markdown("#### Step 3: Entity Confirmation & Triage")
            missing_alert = gr.Markdown()
            with gr.Row():
                with gr.Column(scale=6):
                    title_input = gr.Textbox(label="Work Order Title *", placeholder="e.g. Internet connectivity failure in Computer Lab 3")
                    with gr.Row():
                        category_input = gr.Dropdown(
                            choices=["Network", "Hardware", "Electrical", "Plumbing", "Facilities", "Software", "Other"],
                            value="Network",
                            label="Domain Category *",
                        )
                        priority_input = gr.Radio(
                            choices=["Low", "Medium", "High", "Critical"],
                            value="Medium",
                            label="Triage Severity (SLA Target) *",
                        )
                    with gr.Row():
                        location_input = gr.Textbox(label="Campus Location *", placeholder="e.g. Computer Lab 3, 2nd Floor")
                        asset_input = gr.Textbox(label="Equipment / Asset ID (Optional)", placeholder="e.g. PROJ-04, PC-12")

                    with gr.Row():
                        gr.Markdown("Quick Location Nodes:")
                        loc_btn_1 = gr.Button("Computer Lab 3", size="sm")
                        loc_btn_2 = gr.Button("Classroom 204", size="sm")
                        loc_btn_3 = gr.Button("Seminar Hall A", size="sm")
                        loc_btn_4 = gr.Button("Hostel Block C", size="sm")

                    desc_input = gr.Textbox(lines=3, label="Technical Description *", placeholder="Detailed problem statement...")
                    reasoning_box = gr.Markdown()

                    submit_ticket_btn = gr.Button("🚀 Confirm & Submit Ticket to Database", variant="primary", size="lg")

                with gr.Column(scale=4):
                    submission_result = gr.Markdown()
                    last_created_ticket = gr.Textbox(visible=False)

            # Wiring Tab 1 Callbacks
            transcribe_btn.click(
                fn=on_transcribe,
                inputs=[audio_input, language_selector],
                outputs=[transcript_box, transcribe_info],
            ).then(
                fn=lambda text: text,
                inputs=[transcript_box],
                outputs=[raw_transcript_cache],
            )

            for idx, btn in enumerate(preset_buttons):
                btn.click(
                    fn=lambda i=idx: on_load_preset(i),
                    outputs=[transcript_box, transcribe_info],
                ).then(
                    fn=lambda text: text,
                    inputs=[transcript_box],
                    outputs=[raw_transcript_cache],
                )

            extract_btn.click(
                fn=on_extract,
                inputs=[transcript_box, language_selector],
                outputs=[
                    title_input,
                    category_input,
                    location_input,
                    priority_input,
                    asset_input,
                    desc_input,
                    reasoning_box,
                    missing_alert,
                ],
            )

            loc_btn_1.click(fn=lambda: "Computer Lab 3", outputs=[location_input])
            loc_btn_2.click(fn=lambda: "Classroom 204", outputs=[location_input])
            loc_btn_3.click(fn=lambda: "Seminar Hall A", outputs=[location_input])
            loc_btn_4.click(fn=lambda: "Hostel Block C", outputs=[location_input])

            submit_ticket_btn.click(
                fn=on_submit_ticket,
                inputs=[
                    title_input,
                    category_input,
                    location_input,
                    priority_input,
                    asset_input,
                    desc_input,
                    raw_transcript_cache,
                    transcript_box,
                ],
                outputs=[submission_result, last_created_ticket],
            )

        # ======================================================================
        # Tab 2: Ticket Register
        # ======================================================================
        with gr.Tab("📋 Ticket Register", id="tab_register"):
            gr.Markdown("### Real-Time Operational Ticket Register (Supabase PostgreSQL)")
            with gr.Row():
                search_box = gr.Textbox(label="Search", placeholder="Search by Ticket ID (VO-1001), keywords, location...")
                status_filter = gr.Dropdown(choices=["All", "Open", "In Progress", "Resolved", "Closed"], value="All", label="Status")
                category_filter = gr.Dropdown(choices=["All", "Network", "Hardware", "Electrical", "Plumbing", "Facilities", "Software", "Other"], value="All", label="Category")
                priority_filter = gr.Dropdown(choices=["All", "Critical", "High", "Medium", "Low"], value="All", label="Priority")
                refresh_register_btn = gr.Button("🔄 Refresh Register", variant="secondary")

            tickets_df = gr.DataFrame(
                headers=["Ticket ID", "Title", "Category", "Campus Location", "Priority", "Status", "Created At"],
                interactive=False,
                label="Registered Field Incidents",
            )

            # Wiring Tab 2
            refresh_register_btn.click(
                fn=on_load_tickets_dataframe,
                inputs=[search_box, status_filter, category_filter, priority_filter],
                outputs=[tickets_df],
            )
            demo.load(
                fn=on_load_tickets_dataframe,
                inputs=[search_box, status_filter, category_filter, priority_filter],
                outputs=[tickets_df],
            )

        # ======================================================================
        # Tab 3: Ticket Details & Dispatch
        # ======================================================================
        with gr.Tab("🔍 Ticket Details & Dispatch", id="tab_details"):
            gr.Markdown("### Work Order Inspector & Technician Status Control")
            with gr.Row():
                ticket_lookup_id = gr.Textbox(label="Lookup Ticket ID", placeholder="e.g. VO-1001", value="VO-1001")
                fetch_ticket_btn = gr.Button("Inspect Ticket", variant="secondary")

            with gr.Row():
                with gr.Column(scale=7):
                    ticket_header_view = gr.Markdown("### Select a ticket to view details.")
                    ticket_desc_view = gr.Markdown()
                    ticket_location_view = gr.Markdown()
                    ticket_transcript_view = gr.Markdown()
                    ticket_history_view = gr.Markdown()

                with gr.Column(scale=5):
                    gr.Markdown("#### ⚡ Technician Dispatch Actions")
                    new_status_select = gr.Dropdown(
                        choices=["Open", "In Progress", "Resolved", "Closed"],
                        value="Open",
                        label="Update Work Order Status",
                    )
                    resolution_notes_input = gr.Textbox(lines=2, label="Resolution Sign-off Notes", placeholder="Actions taken by field technician...")
                    update_status_btn = gr.Button("Commit Status Update", variant="primary")
                    status_feedback = gr.Markdown()

                    gr.Markdown("---")
                    gr.Markdown("#### 💬 Append Internal Technician Note")
                    new_note_input = gr.Textbox(lines=2, placeholder="Add field observation or technician comment...", label="Internal Note")
                    add_note_btn = gr.Button("Append Note to Ticket", variant="secondary")
                    note_feedback = gr.Markdown()

            # Wiring Tab 3
            fetch_ticket_btn.click(
                fn=on_get_ticket_details,
                inputs=[ticket_lookup_id],
                outputs=[
                    ticket_header_view,
                    ticket_desc_view,
                    ticket_location_view,
                    ticket_transcript_view,
                    ticket_history_view,
                    new_status_select,
                    resolution_notes_input,
                ],
            )

            update_status_btn.click(
                fn=on_update_status,
                inputs=[ticket_lookup_id, new_status_select, resolution_notes_input],
                outputs=[status_feedback, new_status_select],
            ).then(
                fn=on_get_ticket_details,
                inputs=[ticket_lookup_id],
                outputs=[
                    ticket_header_view,
                    ticket_desc_view,
                    ticket_location_view,
                    ticket_transcript_view,
                    ticket_history_view,
                    new_status_select,
                    resolution_notes_input,
                ],
            )

            add_note_btn.click(
                fn=on_add_technician_note,
                inputs=[ticket_lookup_id, new_note_input],
                outputs=[note_feedback, new_note_input],
            ).then(
                fn=on_get_ticket_details,
                inputs=[ticket_lookup_id],
                outputs=[
                    ticket_header_view,
                    ticket_desc_view,
                    ticket_location_view,
                    ticket_transcript_view,
                    ticket_history_view,
                    new_status_select,
                    resolution_notes_input,
                ],
            )

        # ======================================================================
        # Tab 4: Admin Dashboard
        # ======================================================================
        with gr.Tab("📊 Operations Control Room", id="tab_dashboard"):
            gr.Markdown("### Real-Time Operational Analytics (Live Database Records)")
            with gr.Row():
                sla_slider = gr.Slider(minimum=12, maximum=120, value=48, step=12, label="SLA Target Window (Hours)")
                refresh_analytics_btn = gr.Button("🔄 Refresh Control Room", variant="secondary")

            kpi_display = gr.Markdown(elem_classes=["kpi-table"])

            with gr.Row():
                with gr.Column():
                    gr.Markdown("#### Incidents by Operational Domain")
                    cat_chart_df = gr.DataFrame(headers=["Category", "Count"], interactive=False)
                with gr.Column():
                    gr.Markdown("#### Incidents by Triage Severity")
                    pri_chart_df = gr.DataFrame(headers=["Priority", "Count"], interactive=False)

            with gr.Row():
                with gr.Column(scale=7):
                    gr.Markdown("#### Ingestion Velocity (Past 7 Days)")
                    trend_chart_df = gr.DataFrame(headers=["Date", "Daily Count"], interactive=False)
                with gr.Column(scale=5):
                    gr.Markdown("#### Top Recurring Campus Locations")
                    locations_display = gr.Markdown()

            # Wiring Tab 4
            refresh_analytics_btn.click(
                fn=on_get_analytics,
                inputs=[sla_slider],
                outputs=[kpi_display, cat_chart_df, pri_chart_df, trend_chart_df, locations_display],
            )
            demo.load(
                fn=on_get_analytics,
                inputs=[sla_slider],
                outputs=[kpi_display, cat_chart_df, pri_chart_df, trend_chart_df, locations_display],
            )

        # ======================================================================
        # Tab 5: Telemetry & System Status
        # ======================================================================
        with gr.Tab("⚙️ Telemetry & System Status", id="tab_telemetry"):
            gr.Markdown("### System Diagnostics, AI Provider Health, & Privacy Protocol")
            with gr.Row():
                with gr.Column():
                    gr.Markdown("#### 🎙️ Gnani AI Speech Engine")
                    ping_gnani_btn = gr.Button("⚡ Test Gnani STT API Connection", variant="secondary")
                    gnani_status_box = gr.Markdown()
                    gr.Markdown(
                        """
                        - **Endpoint:** `https://api.vachana.ai/stt/v3`
                        - **Default Dialect:** `te-IN` (Telugu)
                        - **Authentication:** `X-API-Key-ID` Header
                        - **Supported Dialects:** Telugu (`te-IN`), Indian English (`en-IN`), Hindi (`hi-IN`)
                        """
                    )

                with gr.Column():
                    gr.Markdown("#### 🐘 Supabase PostgreSQL Storage")
                    check_db_btn = gr.Button("⚡ Check Supabase Connection", variant="secondary")
                    db_status_box = gr.Markdown()
                    gr.Markdown(
                        """
                        - **Connection:** Managed Connection Pooler (Session Mode)
                        - **Schema:** Relational DDL with Foreign Keys & Audit Log
                        - **Security:** Server-side Secret Storage (No browser exposure)
                        """
                    )

            gr.Markdown("---")
            gr.Markdown(
                """
                #### 🔒 Voice Privacy & Data Retention Protocol
                - **Zero Permanent Audio Retention:** Audio streams uploaded or recorded in VoiceOps are converted to temporary buffers, processed through the configured speech-to-text API, and discarded immediately after transcription.
                - **Human Review:** The transcribed text is presented to the user for verification before any operational ticket is committed to Supabase.
                - **Audit Trail:** Every status transition is timestamped and recorded in the `ticket_history` relational table.
                """
            )

            # Wiring Tab 5
            ping_gnani_btn.click(fn=on_ping_gnani, outputs=[gnani_status_box])
            check_db_btn.click(fn=on_check_supabase, outputs=[db_status_box])
            demo.load(fn=on_ping_gnani, outputs=[gnani_status_box])
            demo.load(fn=on_check_supabase, outputs=[db_status_box])

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

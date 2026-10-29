def test_ticket_lifecycle_and_history(client):
    # 1. Create ticket
    payload = {
        "title": "Internet connectivity failure in Computer Lab 3",
        "description": "Internet has not been working since morning.",
        "transcript_original": "Internet is down in lab 3",
        "transcript_reviewed": "The computer lab 3 internet has not been working since morning.",
        "category": "Network",
        "location": "Computer Lab 3",
        "priority": "High"
    }
    create_res = client.post("/api/tickets", json=payload)
    assert create_res.status_code == 201
    ticket = create_res.json()
    assert ticket["ticket_number"] == "VO-1001"
    assert ticket["status"] == "Open"
    assert len(ticket["history"]) >= 1

    ticket_id = ticket["id"]

    # 2. Update Status to In Progress
    update_res = client.patch(f"/api/tickets/{ticket_id}", json={"status": "In Progress"})
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "In Progress"

    # 3. Add Internal Note
    note_res = client.post(
        f"/api/tickets/{ticket_id}/notes",
        json={"note": "Technician dispatched to replace the switch."}
    )
    assert note_res.status_code == 201

    # 4. Resolve Ticket
    resolve_res = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"status": "Resolved", "resolution_notes": "Port restarted on switchboard."}
    )
    assert resolve_res.status_code == 200
    resolved = resolve_res.json()
    assert resolved["status"] == "Resolved"
    assert resolved["resolved_at"] is not None

    # 5. Check Audit History
    hist_res = client.get(f"/api/tickets/{ticket_id}/history")
    assert hist_res.status_code == 200
    history_entries = hist_res.json()
    actions = [h["action"] for h in history_entries]
    assert "created" in actions
    assert "status_changed" in actions
    assert "note_added" in actions


def test_ticket_list_and_filter(client):
    # Create two tickets
    client.post("/api/tickets", json={
        "title": "Projector issue",
        "description": "Projector not working in room 101",
        "transcript_reviewed": "Projector not working in room 101",
        "category": "Hardware",
        "location": "Room 101",
        "priority": "Medium"
    })
    client.post("/api/tickets", json={
        "title": "Water leak in washroom",
        "description": "Pipe leaking",
        "transcript_reviewed": "Water leak in CSE washroom",
        "category": "Plumbing",
        "location": "CSE Block",
        "priority": "Low"
    })

    # Filter by category
    res = client.get("/api/tickets?category=Hardware")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["category"] == "Hardware"

    # Search keyword
    search_res = client.get("/api/tickets?search=washroom")
    assert search_res.status_code == 200
    search_items = search_res.json()
    assert len(search_items) == 1
    assert search_items[0]["category"] == "Plumbing"

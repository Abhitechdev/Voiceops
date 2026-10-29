def test_analytics_empty_database_zero_state(client):
    # Pure zero state test
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_tickets"] == 0
    assert data["open_tickets"] == 0
    assert data["in_progress_tickets"] == 0
    assert data["resolved_tickets"] == 0
    assert data["by_category"] == []
    assert data["by_priority"] == []
    assert data["avg_resolution_hours"] == 0.0


def test_analytics_calculated_from_db(client):
    # Create an open ticket and a resolved ticket
    res1 = client.post("/api/tickets", json={
        "title": "Network outage",
        "description": "Lab internet down",
        "transcript_reviewed": "Lab internet down",
        "category": "Network",
        "location": "Lab 1",
        "priority": "High"
    })
    ticket1_id = res1.json()["id"]

    res2 = client.post("/api/tickets", json={
        "title": "Loose cable",
        "description": "Loose mouse cable",
        "transcript_reviewed": "Loose mouse cable",
        "category": "Hardware",
        "location": "Lab 2",
        "priority": "Low"
    })
    ticket2_id = res2.json()["id"]

    # Resolve ticket 2
    client.patch(f"/api/tickets/{ticket2_id}", json={"status": "Resolved"})

    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_tickets"] == 2
    assert data["open_tickets"] == 1
    assert data["resolved_tickets"] == 1
    assert any(c["category"] == "Network" and c["count"] == 1 for c in data["by_category"])
    assert any(c["category"] == "Hardware" and c["count"] == 1 for c in data["by_category"])

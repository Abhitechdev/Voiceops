def test_extract_network_issue(client):
    payload = {
        "transcript_reviewed": "The computer lab 3 internet has not been working since morning, students cannot submit their lab assignments.",
        "language": "en-IN"
    }
    response = client.post("/api/issues/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Network"
    assert "Computer Lab 3" in data["location"]
    assert data["priority"] in ["High", "Critical"]
    assert len(data["title"]) > 0


def test_extract_hardware_issue_code_mixed(client):
    payload = {
        "transcript_reviewed": "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
        "language": "te-IN"
    }
    response = client.post("/api/issues/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Hardware"
    assert "Classroom Two" in data["location"]


def test_extract_electrical_critical_issue(client):
    payload = {
        "transcript_reviewed": "Power socket near workbench four is sparking and tripping the main circuit breaker.",
        "language": "en-IN"
    }
    response = client.post("/api/issues/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Electrical"
    assert data["priority"] == "Critical"


def test_extract_missing_location_flagged(client):
    payload = {
        "transcript_reviewed": "A ceiling light is flickering very annoying.",
        "language": "en-IN"
    }
    response = client.post("/api/issues/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "location" in data["missing_fields"]

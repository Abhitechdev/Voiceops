import io


def test_transcription_empty_file_rejected(client):
    file_data = io.BytesIO(b"")
    response = client.post(
        "/api/transcriptions",
        files={"file": ("test.webm", file_data, "audio/webm")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_transcription_unsupported_extension_rejected(client):
    file_data = io.BytesIO(b"not an audio format")
    response = client.post(
        "/api/transcriptions",
        files={"file": ("malicious.exe", file_data, "application/octet-stream")}
    )
    assert response.status_code == 415


def test_transcription_mock_service_success(client, monkeypatch):
    from app.services.transcription import transcription_service
    monkeypatch.setattr(transcription_service, "mock_mode", True)
    file_data = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = client.post(
        "/api/transcriptions",
        files={"file": ("recording.wav", file_data, "audio/wav")},
        data={"language": "te-IN"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "transcript" in data
    assert len(data["transcript"]) > 0
    assert data["provider"] in ["mock_gnani_adapter", "gnani_ai"]
    assert "confidence" in data

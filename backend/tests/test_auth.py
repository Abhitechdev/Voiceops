def test_register_and_login(client):
    # Register
    reg_payload = {
        "name": "Test Reporter",
        "email": "reporter@test.com",
        "password": "securepassword123",
        "role": "reporter"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "reporter@test.com"

    # Login
    login_payload = {
        "email": "reporter@test.com",
        "password": "securepassword123"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Profile (/api/auth/me)
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Test Reporter"

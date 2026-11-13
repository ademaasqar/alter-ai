from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

BODY = {
    "roles": [
        {"role": "Data Analyst", "required_skills": ["Python", "Data Analysis"], "min_hours": 10},
        {"role": "Mobile Developer", "required_skills": ["Flutter"], "min_hours": 8},
    ],
    "max_total_hours": 20,
}


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_find_team_ok():
    r = client.post("/find-team", json=BODY)
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert len(r.json()["team"]) == 2


def test_find_team_no_solution():
    r = client.post("/find-team", json={**BODY, "max_total_hours": 5})
    assert r.status_code == 200
    assert r.json()["success"] is False


def test_invalid_input_returns_422():
    assert client.post("/find-team", json={"roles": []}).status_code == 422
    assert client.post("/find-team", json={"roles": "oops"}).status_code == 422


def test_agents_endpoint_hides_private_data():
    data = client.get("/agents").json()
    assert len(data) == 8
    for a in data:
        assert "interests" not in a
        assert "name" not in a
from backend.models import Profile, RoleRequest
from backend.agents.personal_agent import PersonalAgent

req = RoleRequest("Data Analyst", ["Python", "Data Analysis"], 10)


def make(hours, skills=("Python",)):
    return PersonalAgent(Profile("p1", "Aidos", "Data", list(skills), ["ML"], hours))


def test_accept():
    assert make(10).decide(req).action == "accept"


def test_counter():
    assert make(6).decide(req).action == "counter"


def test_decline_no_skills():
    assert make(10, skills=("Flutter",)).decide(req).action == "decline"


def test_privacy_interests_not_shared():
    resp = make(10).decide(req)
    assert "interests" not in resp.shared_info
    assert "name" not in resp.shared_info

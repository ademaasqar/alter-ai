import pytest

from backend.models import RoleRequest
from backend.data_loader import load_profiles
from backend.agents.network import AgentNetwork
from backend.service import find_team

DA = RoleRequest("Data Analyst", ["Python", "Data Analysis"], 10)
MOBILE = RoleRequest("Mobile Developer", ["Flutter"], 8)


def net():
    return AgentNetwork(load_profiles())


def test_full_pipeline_finds_best_team():
    result = find_team(net(), [DA, MOBILE], max_total_hours=20)
    assert result["success"] is True
    team = {m["role"]: m["agent_id"] for m in result["team"]}
    assert team == {"Data Analyst": "p01", "Mobile Developer": "p02"}
    assert all(0 <= m["score"] <= 1 for m in result["team"])
    assert len(result["log"]) > 0


def test_pipeline_reports_failure_clearly():
    result = find_team(net(), [DA, MOBILE], max_total_hours=5)
    assert result["success"] is False
    assert result["team"] == []


def test_invalid_input_is_rejected():
    with pytest.raises(ValueError):
        find_team(net(), [])
    with pytest.raises(ValueError):
        find_team(net(), [RoleRequest("X", [], 5)])
    with pytest.raises(ValueError):
        find_team(net(), [RoleRequest("X", ["Python"], 0)])
    with pytest.raises(ValueError):
        find_team(net(), [DA, DA])
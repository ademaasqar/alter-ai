from backend.models import Profile, RoleRequest
from backend.data_loader import load_profiles
from backend.agents.network import AgentNetwork
from backend.csp.solver import build_domains, solve

DA = RoleRequest("Data Analyst", ["Python", "Data Analysis"], 10)
MOBILE = RoleRequest("Mobile Developer", ["Flutter"], 8)


def real_network():
    return AgentNetwork(load_profiles())


def test_finds_valid_team():
    result = solve(build_domains(real_network(), [DA, MOBILE]))
    assert result.solution is not None
    ids = [c.agent_id for c in result.solution.values()]
    assert len(ids) == 2 and len(set(ids)) == 2


def test_no_solution_when_not_enough_people():
    reqs = [RoleRequest(f"Flutter Dev {i}", ["Flutter"], 8) for i in range(3)]
    result = solve(build_domains(real_network(), reqs))
    assert result.solution is None


def test_hours_budget_constraint():
    domains = build_domains(real_network(), [DA, MOBILE])
    ok = solve(domains, max_total_hours=12)
    assert ok.solution is not None
    assert sum(c.offered_hours for c in ok.solution.values()) <= 12
    assert solve(domains, max_total_hours=5).solution is None


def test_excluded_people_are_not_used():
    result = solve(build_domains(real_network(), [DA]), excluded_ids=("p01",))
    assert result.solution["Data Analyst"].agent_id != "p01"


def test_heuristics_reduce_search():
    profiles = [
        Profile("a", "A", "d", ["X", "Y"], ["i"], 10),
        Profile("b", "B", "d", ["X"], ["i"], 10),
    ]
    reqs = [RoleRequest("role1", ["X"], 10), RoleRequest("role2", ["Y"], 10)]
    domains = build_domains(AgentNetwork(profiles), reqs)
    naive = solve(domains, use_mrv=False, use_fc=False)
    fast = solve(domains, use_mrv=True, use_fc=True)
    assert naive.solution is not None and fast.solution is not None
    assert fast.nodes < naive.nodes
from backend.matching import compatibility
from backend.csp.solver import build_domains, solve


def validate(requests):
    if not requests:
        raise ValueError("At least one role is required")
    roles = [r.role for r in requests]
    if len(set(roles)) != len(roles):
        raise ValueError("Role names must be unique")
    for r in requests:
        if not r.role.strip():
            raise ValueError("Role name cannot be empty")
        if not r.required_skills:
            raise ValueError(f"Role '{r.role}' needs at least one skill")
        if r.min_hours <= 0:
            raise ValueError(f"Role '{r.role}': hours must be positive")


def find_team(network, requests, max_total_hours=None, excluded_ids=()):
    """Full pipeline: agents negotiate, compatibility ranks, CSP picks the team."""
    validate(requests)
    by_role = {r.role: r for r in requests}

    domains = build_domains(network, requests)
    scores = {}
    for role, cands in domains.items():
        for c in cands:
            scores[(role, c.agent_id)] = compatibility(c.shared_info, by_role[role])
        # best match first: the solver tries the best candidates first
        cands.sort(key=lambda c: scores[(role, c.agent_id)], reverse=True)

    result = solve(domains, max_total_hours=max_total_hours, excluded_ids=excluded_ids)

    if result.solution is None:
        return {
            "success": False,
            "message": "No team satisfies all constraints",
            "team": [],
            "nodes": result.nodes,
            "steps": result.steps,
            "log": network.log,
        }

    team = [
        {
            "role": role,
            "agent_id": c.agent_id,
            "action": c.action,
            "offered_hours": c.offered_hours,
            "score": round(scores[(role, c.agent_id)], 2),
            "reason": c.reason,
        }
        for role, c in result.solution.items()
    ]
    return {
        "success": True,
        "message": "Team found",
        "team": team,
        "nodes": result.nodes,
        "steps": result.steps,
        "log": network.log,
    }
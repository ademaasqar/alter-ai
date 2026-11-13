from dataclasses import dataclass, field

from backend.models import AgentResponse


@dataclass
class CSPResult:
    solution: dict[str, AgentResponse] | None
    nodes: int
    steps: list[str] = field(default_factory=list)


def build_domains(network, requests):
    """Domain of each role = agents that accepted or made a counter-offer."""
    return {r.role: network.candidates(r) for r in requests}


def solve(domains, max_total_hours=None, excluded_ids=(), use_mrv=True, use_fc=True) -> CSPResult:
    """Backtracking search with optional MRV and forward checking."""
    domains = {
        role: [c for c in cands if c.agent_id not in excluded_ids]
        for role, cands in domains.items()
    }
    nodes = 0
    steps: list[str] = []

    def consistent(cand, assignment):
        # constraint 1: one person cannot fill two roles
        if any(c.agent_id == cand.agent_id for c in assignment.values()):
            return False
        # constraint 2: total weekly hours must fit the budget
        if max_total_hours is not None:
            total = cand.offered_hours + sum(c.offered_hours for c in assignment.values())
            if total > max_total_hours:
                return False
        return True

    def backtrack(assignment, doms):
        nonlocal nodes
        if len(assignment) == len(domains):
            return dict(assignment)

        unassigned = [r for r in domains if r not in assignment]
        if use_mrv:
            role = min(unassigned, key=lambda r: len(doms[r]))
        else:
            role = unassigned[0]

        for cand in doms[role]:
            nodes += 1
            if not consistent(cand, assignment):
                steps.append(f"{role}: {cand.agent_id} rejected (constraint violated)")
                continue

            assignment[role] = cand
            steps.append(f"{role}: assigned {cand.agent_id}")

            new_doms = doms
            ok = True
            if use_fc:
                new_doms = {}
                for r in unassigned:
                    if r == role:
                        continue
                    new_doms[r] = [c for c in doms[r] if consistent(c, assignment)]
                    if not new_doms[r]:
                        ok = False
                        steps.append(f"{role}: {cand.agent_id} pruned, role {r} has no candidates left")
                        break

            if ok:
                result = backtrack(assignment, new_doms)
                if result is not None:
                    return result

            del assignment[role]
            steps.append(f"{role}: backtrack from {cand.agent_id}")
        return None

    solution = backtrack({}, domains)
    return CSPResult(solution, nodes, steps)
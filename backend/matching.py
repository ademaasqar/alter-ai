from backend.models import RoleRequest


def compatibility(shared_info: dict, request: RoleRequest) -> float:
    """Compatibility score from 0 to 1.

    STUB: share of required skills the person has.
    Participant 2 replaces the body with Bayesian inference;
    the signature must stay the same.
    """
    mine = {s.lower() for s in shared_info.get("skills", [])}
    needed = {s.lower() for s in request.required_skills}
    if not needed:
        return 0.0
    return len(mine & needed) / len(needed)
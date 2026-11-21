from backend.models import RoleRequest

PRIOR_FIT = 0.5  

SKILLS_GIVEN_FIT = {"full": 0.70, "partial": 0.25, "none": 0.05}
SKILLS_GIVEN_NOT = {"full": 0.10, "partial": 0.30, "none": 0.60}
TIME_GIVEN_FIT = {"enough": 0.75, "partial": 0.20, "low": 0.05}
TIME_GIVEN_NOT = {"enough": 0.30, "partial": 0.30, "low": 0.40}


def skills_level(shared_info: dict, request: RoleRequest) -> str:
    mine = {s.lower() for s in shared_info.get("skills", [])}
    needed = {s.lower() for s in request.required_skills}
    common = len(mine & needed)
    if common == len(needed):
        return "full"
    return "partial" if common > 0 else "none"


def time_level(shared_info: dict, request: RoleRequest) -> str:
    hours = shared_info.get("availability_hours", 0)
    if hours >= request.min_hours:
        return "enough"
    return "partial" if hours >= request.min_hours / 2 else "low"


def compatibility(shared_info: dict, request: RoleRequest) -> float:
    """Naive Bayes: P(fit | skills, time), a number from 0 to 1.

    Uses only public data (shared_info). Signature must stay the same.
    """
    if not request.required_skills:
        return 0.0
    s = skills_level(shared_info, request)
    t = time_level(shared_info, request)
    fit = PRIOR_FIT * SKILLS_GIVEN_FIT[s] * TIME_GIVEN_FIT[t]
    not_fit = (1 - PRIOR_FIT) * SKILLS_GIVEN_NOT[s] * TIME_GIVEN_NOT[t]
    return fit / (fit + not_fit)



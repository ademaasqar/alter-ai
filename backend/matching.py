from backend.models import RoleRequest

PRIOR_FIT = 0.5  # начальная вероятность, что человек подходит

# P(наблюдение | подходит) и P(наблюдение | не подходит).
# Таблицы заданы вручную (жасанды деректер), не обучены на реальных данных.
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

from backend.models import RoleRequest
from backend.matching import compatibility

REQ = RoleRequest("Data Analyst", ["Python", "Data Analysis"], 10)


def info(skills, hours):
    return {"skills": skills, "availability_hours": hours}


def test_score_is_probability():
    for skills in ([], ["Python"], ["Python", "Data Analysis"]):
        for hours in (0, 5, 10, 20):
            assert 0 <= compatibility(info(skills, hours), REQ) <= 1


def test_best_case_is_high():
    assert compatibility(info(["Python", "Data Analysis"], 10), REQ) > 0.9


def test_worst_case_is_low():
    assert compatibility(info(["Flutter"], 1), REQ) < 0.1


def test_more_skills_give_higher_score():
    assert compatibility(info(["Python", "Data Analysis"], 10), REQ) > compatibility(info(["Python"], 10), REQ)


def test_more_time_gives_higher_score():
    assert compatibility(info(["Python", "Data Analysis"], 10), REQ) > compatibility(info(["Python", "Data Analysis"], 6), REQ)


def test_missing_fields_do_not_crash():
    assert 0 <= compatibility({}, REQ) <= 1

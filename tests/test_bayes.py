
from backend.models import RoleRequest
from backend.matching import compatibility

REQ = RoleRequest("Data Analyst", ["Python", "Data Analysis"], 10)


def info(skills, hours):
    return {"skills": skills, "availability_hours": hours}


# 1. Нәтиже 0 мен 1 арасында болуы керек
def test_score_is_probability():
    for skills in ([], ["Python"], ["Python", "Data Analysis"]):
        for hours in (0, 5, 10, 20):
            assert 0 <= compatibility(info(skills, hours), REQ) <= 1


# 2. Толық сәйкес үміткердің пайызы жоғары
def test_best_case_is_high():
    assert compatibility(info(["Python", "Data Analysis"], 10), REQ) > 0.9


# 3. Сәйкес емес үміткердің пайызы төмен
def test_worst_case_is_low():
    assert compatibility(info(["Flutter"], 1), REQ) < 0.1


# 4. Дағды көбейсе, сәйкестік артады
def test_more_skills_give_higher_score():
    assert compatibility(info(["Python", "Data Analysis"], 10), REQ) > compatibility(info(["Python"], 10), REQ)


# 5. Бос уақыт көбейсе, сәйкестік артады
def test_more_time_gives_higher_score():
    assert compatibility(info(["Python", "Data Analysis"], 10), REQ) > compatibility(info(["Python", "Data Analysis"], 6), REQ)


# 6. Деректер жетіспесе де, қате шықпауы керек
def test_missing_fields_do_not_crash():
    assert 0 <= compatibility({}, REQ) <= 1


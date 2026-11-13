# ALTER AI — Personal AI Representative Network

Final project for **QAIRU AI Fundamentals 2026**.

Every person has a personal AI agent. The agent knows only what its owner allows to share, talks to other people's agents, negotiates availability and helps to build a project team.

**Team:** [Аты-жөні 1], [Аты-жөні 2]

## Goal

A working application where a user describes the team they need (roles, skills, hours per week). Personal agents answer on behalf of their owners, a constraint solver assembles a valid team, and the system explains the result.

## AI topics implemented

| Week | Topic | Where in the code |
| --- | --- | --- |
| 1 | Intelligent Agents and Environments | `backend/agents/personal_agent.py`, `backend/agents/network.py` |
| 3 | Constraint Satisfaction Problems | `backend/csp/solver.py` |
| 6 | Bayesian Inference | `backend/matching.py` — [описание байесовской модели от участника 2] |

### 1. Intelligent agents
- `PersonalAgent` represents one person. It receives a request, decides to **accept**, **decline** or make a **counter-offer** (fewer hours), and returns a reply.
- Privacy filter: only the fields the owner allowed (`shared_fields`) leave the agent. Interests and name are never sent.
- `AgentNetwork` is the environment: it sends a request to all agents, collects replies and keeps a conversation log.

### 2. Constraint satisfaction (CSP)
- Variables: roles of the team. Domains: agents that accepted or made a counter-offer.
- Constraints: one person cannot fill two roles; total weekly hours must fit the budget; excluded people are not used.
- Algorithm: backtracking search with **MRV** (choose the role with the fewest candidates first) and **forward checking** (remove conflicting candidates from other roles after each choice).

### 3. Bayesian inference
[Участник 2: коротко опиши модель — какие признаки, как считается вероятность совместимости.]
Currently `compatibility()` in `backend/matching.py` is a simple placeholder (share of required skills a person has). The function returns a score from 0 to 1 and ranks candidates before the CSP search.

## How it works

1. The user sends roles and constraints.
2. The request is broadcast to all personal agents.
3. Agents reply (accept / counter / decline) using only shared data.
4. Candidates are ranked by compatibility score.
5. The CSP solver picks a team that satisfies all constraints.
6. The result contains the team, scores, reasons, search steps and the agents' conversation log.

## Project structure

```
backend/
  agents/personal_agent.py   # personal agent with privacy filter
  agents/network.py          # environment, request broadcast, log
  csp/solver.py              # backtracking + MRV + forward checking
  data/profiles.json         # demo profiles
  models.py                  # Profile, RoleRequest, AgentResponse
  matching.py                # compatibility score (Bayesian part)
  service.py                 # full pipeline + input validation
  main.py                    # FastAPI application
  demo.py                    # console demo
tests/                       # 20 automated tests
```

## Installation and run

Requires Python 3.12+.

```
pip install -r requirements.txt
```

Console demo:

```
python -m backend.demo
```

API server:

```
python -m uvicorn backend.main:app --reload
```

Interactive API docs: http://127.0.0.1:8000/docs

Endpoints: `GET /health`, `GET /agents` (public data only), `POST /find-team`.

On Windows use `py` instead of `python` if the `python` command does not work.

## Tests

```
python -m pytest
```

20 tests cover agent decisions, privacy (private fields never leave the agent), the agent network, the CSP solver (valid team, no solution, hours budget, excluded people), the full pipeline, input validation and the API.

Example result: on a test scenario the naive search checks 4 candidates, while MRV with forward checking checks 2.

## Limitations

- Demo uses synthetic profiles, not real people.
- The compatibility score depends on the quality of the Bayesian model.
- Agents use fixed rules, they do not learn from past negotiations.

## Screenshots

[Скриншоты интерфейса и /docs]

## Contribution

See the Team Contribution Statement.

## Security

No API keys or secrets are stored in this repository.
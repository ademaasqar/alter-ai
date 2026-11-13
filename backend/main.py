from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.models import RoleRequest
from backend.data_loader import load_profiles
from backend.agents.network import AgentNetwork
from backend.service import find_team

app = FastAPI(title="ALTER AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RoleIn(BaseModel):
    role: str
    required_skills: list[str]
    min_hours: int


class TeamRequestIn(BaseModel):
    roles: list[RoleIn]
    max_total_hours: int | None = None
    excluded_ids: list[str] = []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/agents")
def agents():
    """Public view of every agent: private fields are never exposed."""
    network = AgentNetwork(load_profiles())
    return [{"id": a.profile.id, **a.public_view()} for a in network.agents.values()]


@app.post("/find-team")
def find_team_endpoint(body: TeamRequestIn):
    network = AgentNetwork(load_profiles())  # fresh network, fresh log
    requests = [RoleRequest(r.role, r.required_skills, r.min_hours) for r in body.roles]
    try:
        return find_team(
            network, requests, body.max_total_hours, tuple(body.excluded_ids)
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
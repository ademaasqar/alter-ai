from dataclasses import dataclass, field


@dataclass
class Profile:
    id: str
    name: str
    domain: str
    skills: list[str]
    interests: list[str]
    availability_hours: int
    shared_fields: list[str] = field(
        default_factory=lambda: ["domain", "skills", "availability_hours"]
    )


@dataclass
class RoleRequest:
    role: str
    required_skills: list[str]
    min_hours: int


@dataclass
class AgentResponse:
    agent_id: str
    action: str  # accept | decline | counter
    offered_hours: int
    reason: str
    shared_info: dict

from backend.models import Profile, RoleRequest, AgentResponse
from backend.agents.personal_agent import PersonalAgent


class AgentNetwork:
    """Environment where personal agents receive requests and reply."""

    def __init__(self, profiles: list[Profile]):
        self.agents = {p.id: PersonalAgent(p) for p in profiles}
        self.log: list[str] = []

    def broadcast(self, request: RoleRequest) -> list[AgentResponse]:
        """Send the request to every agent and collect all replies."""
        responses = []
        for agent_id, agent in self.agents.items():
            self.log.append(f"REQUEST -> {agent_id}: {request.role}")
            resp = agent.decide(request)
            self.log.append(f"{agent_id} -> {resp.action.upper()}: {resp.reason}")
            responses.append(resp)
        return responses

    def candidates(self, request: RoleRequest) -> list[AgentResponse]:
        """Only agents that accepted or made a counter-offer."""
        return [r for r in self.broadcast(request) if r.action != "decline"]

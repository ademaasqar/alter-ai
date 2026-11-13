from backend.models import Profile, RoleRequest, AgentResponse


class PersonalAgent:
    """Agent that represents one person."""

    def __init__(self, profile: Profile):
        self.profile = profile

    def public_view(self) -> dict:
        """Privacy filter: only allowed fields leave the agent."""
        return {k: getattr(self.profile, k) for k in self.profile.shared_fields}

    def decide(self, request: RoleRequest) -> AgentResponse:
        p = self.profile
        mine = {s.lower() for s in p.skills}
        needed = {s.lower() for s in request.required_skills}

        if not (mine & needed):
            action, hours, reason = "decline", 0, "No matching skills"
        elif p.availability_hours >= request.min_hours:
            action, hours, reason = "accept", request.min_hours, "Skills and time fit"
        elif p.availability_hours >= request.min_hours / 2:
            action, hours, reason = "counter", p.availability_hours, "Can offer fewer hours"
        else:
            action, hours, reason = "decline", 0, "Not enough free time"

        return AgentResponse(p.id, action, hours, reason, self.public_view())

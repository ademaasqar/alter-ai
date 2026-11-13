from backend.models import RoleRequest
from backend.data_loader import load_profiles
from backend.agents.network import AgentNetwork
from backend.service import find_team


def main():
    network = AgentNetwork(load_profiles())
    requests = [
        RoleRequest("Data Analyst", ["Python", "Data Analysis"], 10),
        RoleRequest("Mobile Developer", ["Flutter"], 8),
    ]
    result = find_team(network, requests, max_total_hours=20)

    print(result["message"])
    for m in result["team"]:
        print(f"  {m['role']}: {m['agent_id']} | {m['action']} | "
              f"{m['offered_hours']} h/week | score {m['score']} | {m['reason']}")
    print(f"Search nodes checked: {result['nodes']}")
    print("\nAgent conversation (first 6 lines):")
    for line in result["log"][:6]:
        print("  ", line)


if __name__ == "__main__":
    main()
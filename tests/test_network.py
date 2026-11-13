from backend.models import RoleRequest
from backend.data_loader import load_profiles
from backend.agents.network import AgentNetwork


def make_network():
    return AgentNetwork(load_profiles())


def test_data_analyst_candidates():
    req = RoleRequest("Data Analyst", ["Python", "Data Analysis"], 10)
    ids = {r.agent_id for r in make_network().candidates(req)}
    assert "p01" in ids        # fits skills and time
    assert "p07" in ids        # counter-offer, 6 of 10 hours
    assert "p03" not in ids    # too little free time
    assert "p02" not in ids    # no matching skills


def test_mobile_developer_candidates():
    req = RoleRequest("Mobile Developer", ["Flutter"], 8)
    responses = {r.agent_id: r for r in make_network().candidates(req)}
    assert responses["p02"].action == "accept"
    assert responses["p06"].action == "counter"
    assert "p01" not in responses


def test_private_data_never_leaves_network_and_log_is_written():
    net = make_network()
    req = RoleRequest("Data Analyst", ["Python"], 10)
    for resp in net.broadcast(req):
        assert "interests" not in resp.shared_info
        assert "name" not in resp.shared_info
    assert len(net.log) > 0

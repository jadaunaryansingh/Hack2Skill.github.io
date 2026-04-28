from fastapi import APIRouter
from simulation.route_scoring import plan_route, simulate_reroute

router = APIRouter(tags=["Route Planner"])


@router.post("/plan-route")
def plan_route_endpoint(body: dict):
    """
    Plan optimal route with AI scoring.
    Body: { "source": "Mumbai", "destination": "Delhi", "priority": "URGENT" }
    """
    return plan_route(
        source      = body.get("source", ""),
        destination = body.get("destination", ""),
        priority    = body.get("priority", "NORMAL"),
    )


@router.post("/reroute")
def reroute_endpoint(body: dict):
    """
    Simulate a disruption and get rerouting recommendation.
    Body: { "route_id": "A", "disruption_type": "ACCIDENT" }
    """
    return simulate_reroute(
        route_id        = body.get("route_id", "A"),
        disruption_type = body.get("disruption_type", "TRAFFIC_SPIKE"),
    )

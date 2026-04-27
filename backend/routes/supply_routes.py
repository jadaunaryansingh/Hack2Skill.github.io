from fastapi import APIRouter
from simulation.data_engine import (
    generate_routes, generate_fleet, generate_shipments,
    simulate_whatif, CITIES
)

router = APIRouter(tags=["Supply Chain"])


@router.get("/cities")
def get_cities():
    """All logistics hub cities."""
    return CITIES


@router.get("/routes")
def get_routes():
    """All routes with live AI scores."""
    return generate_routes()


@router.get("/routes/{route_id}")
def get_route(route_id: str):
    """Single route details."""
    routes = generate_routes()
    r = next((r for r in routes if r["id"] == route_id), None)
    if not r:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Route not found")
    return r


@router.get("/fleet")
def get_fleet():
    """Fleet positions — refresh every 3s for live tracking."""
    routes = generate_routes()
    return generate_fleet(routes)


@router.get("/shipments")
def get_shipments():
    """All shipments sorted by urgency score."""
    routes    = generate_routes()
    fleet     = generate_fleet(routes)
    shipments = generate_shipments(routes, fleet)
    return sorted(shipments, key=lambda s: -s["urgency_score"])


@router.post("/whatif")
def what_if_simulation(body: dict):
    """
    Simulate a route failure and get cascading impact analysis.
    Body: { "route_id": "RT001", "failure_type": "CLOSURE" }
    """
    route_id     = body.get("route_id", "RT001")
    failure_type = body.get("failure_type", "CLOSURE")

    routes    = generate_routes()
    fleet     = generate_fleet(routes)
    shipments = generate_shipments(routes, fleet)

    return simulate_whatif(route_id, failure_type, routes, shipments)

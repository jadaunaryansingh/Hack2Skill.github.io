from fastapi import APIRouter
from simulation.data_engine import (
    generate_routes, generate_fleet, generate_shipments,
    generate_risk_assessment, generate_alerts
)

router = APIRouter(tags=["Risk & Alerts"])


@router.get("/risk")
def get_risk_assessment():
    """Per-route AI risk scores and factor breakdown."""
    routes = generate_routes()
    return generate_risk_assessment(routes)


@router.get("/alerts")
def get_alerts():
    """Live alert feed — disruptions, delays, AI predictions."""
    routes    = generate_routes()
    fleet     = generate_fleet(routes)
    shipments = generate_shipments(routes, fleet)
    return generate_alerts(routes, shipments)

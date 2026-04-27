from fastapi import APIRouter
from simulation.data_engine import (
    generate_routes, generate_fleet, generate_shipments,
    generate_analytics, generate_health_index
)

router = APIRouter(tags=["Analytics"])


@router.get("/analytics")
def get_analytics():
    """Dashboard analytics — time-series, KPIs, city heatmap."""
    routes    = generate_routes()
    fleet     = generate_fleet(routes)
    shipments = generate_shipments(routes, fleet)
    return generate_analytics(routes, shipments)


@router.get("/health-index")
def get_health_index():
    """Supply Chain Health Index — 0 to 100 composite score."""
    routes    = generate_routes()
    fleet     = generate_fleet(routes)
    shipments = generate_shipments(routes, fleet)
    analytics = generate_analytics(routes, shipments)
    return generate_health_index(analytics)

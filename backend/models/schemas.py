"""
Smart Supply Chain Intelligence Platform — Pydantic Models
All data shapes shared between simulation engine and API routes
"""

from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class ShipmentStatus(str, Enum):
    IN_TRANSIT  = "IN_TRANSIT"
    DELAYED     = "DELAYED"
    REROUTED    = "REROUTED"
    DELIVERED   = "DELIVERED"
    AT_RISK     = "AT_RISK"

class AlertSeverity(str, Enum):
    INFO     = "INFO"
    WARNING  = "WARNING"
    CRITICAL = "CRITICAL"

class VehicleStatus(str, Enum):
    ON_TIME  = "ON_TIME"
    DELAYED  = "DELAYED"
    REROUTED = "REROUTED"
    IDLE     = "IDLE"


# ─── Geographic ──────────────────────────────────────────────────────────────

class Coordinate(BaseModel):
    lat: float
    lng: float

class City(BaseModel):
    id: str
    name: str
    state: str
    lat: float
    lng: float
    hub_tier: Literal[1, 2, 3]          # 1 = major hub, 3 = minor


# ─── Routes ──────────────────────────────────────────────────────────────────

class RoutePoint(BaseModel):
    lat: float
    lng: float

class Route(BaseModel):
    id: str
    name: str
    origin_id: str
    destination_id: str
    origin_name: str
    destination_name: str
    distance_km: float
    base_duration_h: float
    current_duration_h: float
    waypoints: list[RoutePoint]
    risk_score: float           # 0-100 (higher = riskier)
    delay_probability: float    # 0-1
    cost_efficiency: float      # 0-100 (higher = cheaper)
    composite_score: float      # 0-100 (higher = better)
    traffic_level: Literal["LOW", "MODERATE", "HIGH", "SEVERE"]
    weather_severity: Literal["CLEAR", "LIGHT", "MODERATE", "SEVERE"]
    is_active: bool
    is_disrupted: bool
    alternate_for: Optional[str] = None  # route_id this is an alt of


# ─── Fleet ───────────────────────────────────────────────────────────────────

class Vehicle(BaseModel):
    id: str
    name: str
    type: Literal["TRUCK", "VAN", "RAIL", "AIR"]
    current_lat: float
    current_lng: float
    heading: float              # degrees 0-360
    speed_kmh: float
    route_id: str
    shipment_id: str
    progress: float             # 0-1 along route
    status: VehicleStatus
    eta_minutes: int
    driver: str


# ─── Shipments ───────────────────────────────────────────────────────────────

class Shipment(BaseModel):
    id: str
    tracking_code: str
    description: str
    origin_name: str
    destination_name: str
    route_id: str
    vehicle_id: str
    status: ShipmentStatus
    priority: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    urgency_score: float        # 0-100
    weight_kg: float
    value_inr: float
    departure_time: str         # ISO string
    expected_arrival: str
    estimated_arrival: str      # dynamic (with delay)
    delay_minutes: int
    progress: float             # 0-1


# ─── Risk & AI ───────────────────────────────────────────────────────────────

class RiskFactor(BaseModel):
    name: str
    value: float                # 0-100
    weight: float               # contribution weight
    trend: Literal["UP", "DOWN", "STABLE"]

class RouteRisk(BaseModel):
    route_id: str
    route_name: str
    risk_score: float
    delay_probability: float
    factors: list[RiskFactor]
    recommendation: str
    confidence: float           # 0-1

class Alert(BaseModel):
    id: str
    severity: AlertSeverity
    title: str
    message: str
    route_id: Optional[str] = None
    shipment_id: Optional[str] = None
    timestamp: str
    is_read: bool = False


# ─── Analytics ───────────────────────────────────────────────────────────────

class TimeSeriesPoint(BaseModel):
    time: str
    value: float

class AnalyticsData(BaseModel):
    avg_delay_minutes: float
    on_time_percent: float
    total_shipments: int
    active_routes: int
    disrupted_routes: int
    avg_cost_variance: float
    delay_series: list[TimeSeriesPoint]
    efficiency_series: list[TimeSeriesPoint]
    cost_series: list[TimeSeriesPoint]
    city_heatmap: dict[str, float]  # city_id -> disruption frequency


# ─── Health Index ────────────────────────────────────────────────────────────

class HealthIndex(BaseModel):
    score: float                # 0-100
    grade: Literal["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"]
    trend: Literal["UP", "DOWN", "STABLE"]
    components: dict[str, float]  # component -> score


# ─── What-If Simulation ──────────────────────────────────────────────────────

class WhatIfRequest(BaseModel):
    route_id: str
    failure_type: Literal["CLOSURE", "SEVERE_DELAY", "WEATHER", "ACCIDENT"]

class WhatIfImpact(BaseModel):
    affected_shipments: int
    cascading_delays: list[str]   # shipment IDs
    recommended_reroutes: list[Route]
    estimated_delay_minutes: int
    cost_impact_inr: float
    risk_increase: float


# ─── AI Assistant ────────────────────────────────────────────────────────────

class AssistantQuery(BaseModel):
    message: str
    context: Optional[str] = None

class AssistantResponse(BaseModel):
    response: str
    suggestions: list[str]
    related_routes: list[str]
    confidence: float

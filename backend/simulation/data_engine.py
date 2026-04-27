"""
Smart Supply Chain Intelligence Platform — Data Engine
Generates realistic India-focused supply chain simulation data.
All data refreshes on every call with realistic random variance.
"""

import random
import math
import time
from datetime import datetime, timedelta
from typing import Any

# ─── Seed for reproducibility within a session ────────────────────────────────
_session_seed = int(time.time())
random.seed(_session_seed)


# ─── Indian Logistics Cities ──────────────────────────────────────────────────
CITIES = [
    {"id": "DEL", "name": "Delhi",      "state": "Delhi",         "lat": 28.6139, "lng": 77.2090, "hub_tier": 1},
    {"id": "MUM", "name": "Mumbai",     "state": "Maharashtra",   "lat": 19.0760, "lng": 72.8777, "hub_tier": 1},
    {"id": "BLR", "name": "Bengaluru",  "state": "Karnataka",     "lat": 12.9716, "lng": 77.5946, "hub_tier": 1},
    {"id": "CHN", "name": "Chennai",    "state": "Tamil Nadu",    "lat": 13.0827, "lng": 80.2707, "hub_tier": 1},
    {"id": "KOL", "name": "Kolkata",    "state": "West Bengal",   "lat": 22.5726, "lng": 88.3639, "hub_tier": 1},
    {"id": "HYD", "name": "Hyderabad",  "state": "Telangana",     "lat": 17.3850, "lng": 78.4867, "hub_tier": 2},
    {"id": "PUN", "name": "Pune",       "state": "Maharashtra",   "lat": 18.5204, "lng": 73.8567, "hub_tier": 2},
    {"id": "AHM", "name": "Ahmedabad",  "state": "Gujarat",       "lat": 23.0225, "lng": 72.5714, "hub_tier": 2},
    {"id": "JAI", "name": "Jaipur",     "state": "Rajasthan",     "lat": 26.9124, "lng": 75.7873, "hub_tier": 2},
    {"id": "LKO", "name": "Lucknow",    "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462, "hub_tier": 2},
    {"id": "SUR", "name": "Surat",      "state": "Gujarat",       "lat": 21.1702, "lng": 72.8311, "hub_tier": 3},
    {"id": "KOC", "name": "Kochi",      "state": "Kerala",        "lat": 9.9312,  "lng": 76.2673, "hub_tier": 3},
]

CITY_MAP = {c["id"]: c for c in CITIES}

# ─── Route Definitions ────────────────────────────────────────────────────────
ROUTE_DEFS = [
    # (origin, destination, distance_km, base_duration_h, waypoints_lat_lng)
    ("DEL", "MUM", 1415, 22.0, [(26.45, 73.02), (23.02, 72.57)]),
    ("DEL", "BLR", 2150, 33.0, [(23.22, 77.43), (17.38, 78.48)]),
    ("MUM", "CHN", 1333, 21.0, [(16.50, 74.50), (13.08, 80.27)]),
    ("BLR", "CHN", 347,   6.0, [(12.67, 79.86)]),
    ("DEL", "KOL", 1530, 24.0, [(25.37, 82.67), (22.57, 88.36)]),
    ("MUM", "HYD", 711,  12.0, [(17.38, 76.80)]),
    ("DEL", "JAI", 280,   4.5, [(27.02, 76.06)]),
    ("MUM", "PUN", 148,   2.5, [(18.52, 73.85)]),
    ("MUM", "AHM", 524,   8.5, [(21.17, 72.83)]),
    ("AHM", "DEL", 943,  15.0, [(25.32, 74.52)]),
    ("HYD", "CHN", 626,  10.0, [(13.83, 79.55)]),
    ("KOL", "LKO", 989,  16.0, [(26.84, 80.94)]),
    ("BLR", "KOC", 572,   9.0, [(11.00, 76.12)]),
    ("DEL", "LKO", 558,   9.0, [(27.24, 78.67)]),
    ("JAI", "AHM", 648,  10.5, [(24.58, 74.35)]),
    ("CHN", "KOC", 721,  12.0, [(10.08, 78.19)]),
    ("HYD", "BLR", 575,   9.5, [(15.33, 77.32)]),
    ("KOL", "BLR", 1871, 29.0, [(20.26, 85.83), (17.38, 78.48)]),
]

TRAFFIC_LEVELS = ["LOW", "MODERATE", "HIGH", "SEVERE"]
WEATHER_LEVELS = ["CLEAR", "LIGHT", "MODERATE", "SEVERE"]

GOODS = [
    "Pharmaceuticals",  "Electronics", "Auto Parts",    "Textiles",
    "FMCG",            "Chemicals",    "Cold Chain",    "Industrial",
    "Agricultural",    "Luxury Goods", "Medical Equip", "Steel Coils",
]

DRIVERS = [
    "Rajesh Kumar", "Amit Singh",   "Priya Sharma", "Suresh Reddy",
    "Neha Patel",   "Vikram Nair",  "Anita Gupta",  "Ravi Mehta",
    "Sunita Roy",   "Deepak Verma", "Kavya Iyer",   "Arun Pillai",
    "Pooja Joshi",  "Manish Tiwari","Sneha Das",
]

VEHICLE_TYPES = ["TRUCK", "VAN", "TRUCK", "TRUCK", "RAIL", "AIR"]


# ─── Helper Functions ─────────────────────────────────────────────────────────

def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t

def _noisy(base: float, noise: float = 0.1) -> float:
    """Add realistic random noise to a value."""
    return max(0.0, base + random.uniform(-noise * base, noise * base))

def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))

def _iso_now(offset_minutes: int = 0) -> str:
    t = datetime.utcnow() + timedelta(minutes=offset_minutes)
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")

def _haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─── Core Data Generators ─────────────────────────────────────────────────────

def generate_routes() -> list[dict]:
    """Generate all route objects with real-time AI scoring."""
    routes = []
    for i, (orig, dest, dist, base_h, waypoints) in enumerate(ROUTE_DEFS):
        o = CITY_MAP[orig]
        d = CITY_MAP[dest]

        # Simulate realistic dynamic conditions
        traffic_idx  = random.choices([0,1,2,3], weights=[30,40,20,10])[0]
        weather_idx  = random.choices([0,1,2,3], weights=[50,30,15,5])[0]
        congestion   = random.uniform(0, 60)
        reliability  = random.uniform(50, 99)

        traffic_mult = [1.0, 1.25, 1.6, 2.2][traffic_idx]
        weather_mult = [1.0, 1.1,  1.3, 1.7][weather_idx]

        current_h = base_h * traffic_mult * weather_mult * random.uniform(0.95, 1.05)

        # AI Risk Score formula
        traffic_score  = [0, 25, 55, 90][traffic_idx]
        weather_score  = [0, 20, 50, 85][weather_idx]
        risk_score = _clamp(
            traffic_score  * 0.35 +
            weather_score  * 0.25 +
            congestion     * 0.20 +
            (100 - reliability) * 0.20,
            0, 100
        )

        # Sigmoid delay probability
        delay_prob = 1 / (1 + math.exp(-(risk_score - 50) / 12))

        # Cost efficiency (inverse of delay cost)
        cost_efficiency = _clamp(100 - risk_score * 0.6 - (current_h - base_h) * 3, 10, 100)

        # Composite score (higher = better route)
        composite = _clamp(100 - risk_score * 0.5 - delay_prob * 30 + cost_efficiency * 0.2, 0, 100)

        is_disrupted = risk_score > 65

        route_waypoints = [{"lat": lat, "lng": lng} for lat, lng in waypoints]

        routes.append({
            "id": f"RT{i+1:03d}",
            "name": f"{o['name']} → {d['name']}",
            "origin_id": orig,
            "destination_id": dest,
            "origin_name": o["name"],
            "destination_name": d["name"],
            "distance_km": dist,
            "base_duration_h": base_h,
            "current_duration_h": round(current_h, 2),
            "waypoints": [{"lat": o["lat"], "lng": o["lng"]}] + route_waypoints + [{"lat": d["lat"], "lng": d["lng"]}],
            "risk_score": round(risk_score, 1),
            "delay_probability": round(delay_prob, 3),
            "cost_efficiency": round(cost_efficiency, 1),
            "composite_score": round(composite, 1),
            "traffic_level": TRAFFIC_LEVELS[traffic_idx],
            "weather_severity": WEATHER_LEVELS[weather_idx],
            "is_active": True,
            "is_disrupted": is_disrupted,
            "alternate_for": None,
        })

    return routes


def generate_fleet(routes: list[dict]) -> list[dict]:
    """Generate 15 fleet vehicles moving along routes."""
    vehicles = []
    for i in range(15):
        route = routes[i % len(routes)]
        progress = random.uniform(0.05, 0.95)
        wps = route["waypoints"]

        # Interpolate position along waypoints
        seg_count = len(wps) - 1
        seg_idx   = int(progress * seg_count)
        seg_idx   = min(seg_idx, seg_count - 1)
        seg_t     = (progress * seg_count) - seg_idx
        p1, p2    = wps[seg_idx], wps[min(seg_idx+1, seg_count)]

        lat = _lerp(p1["lat"], p2["lat"], seg_t)
        lng = _lerp(p1["lng"], p2["lng"], seg_t)

        # Compute heading
        dlat = p2["lat"] - p1["lat"]
        dlng = p2["lng"] - p1["lng"]
        heading = math.degrees(math.atan2(dlng, dlat)) % 360

        status_choices = ["ON_TIME", "DELAYED", "REROUTED"]
        weights = [60, 30, 10] if not route["is_disrupted"] else [20, 60, 20]
        status = random.choices(status_choices, weights=weights)[0]

        speed = _noisy(65, 0.2) if status == "ON_TIME" else _noisy(35, 0.2)
        remaining_dist = route["distance_km"] * (1 - progress)
        eta_min = int((remaining_dist / max(speed, 5)) * 60)

        v_type = random.choice(VEHICLE_TYPES)

        vehicles.append({
            "id": f"VH{i+1:03d}",
            "name": f"{'Truck' if v_type=='TRUCK' else v_type.title()} {i+1:02d}",
            "type": v_type,
            "current_lat": round(lat, 6),
            "current_lng": round(lng, 6),
            "heading": round(heading, 1),
            "speed_kmh": round(speed, 1),
            "route_id": route["id"],
            "shipment_id": f"SH{i+1:03d}",
            "progress": round(progress, 3),
            "status": status,
            "eta_minutes": eta_min,
            "driver": DRIVERS[i % len(DRIVERS)],
        })

    return vehicles


def generate_shipments(routes: list[dict], vehicles: list[dict]) -> list[dict]:
    """Generate 30 shipments with dynamic status and priority."""
    shipments = []
    priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    p_weights  = [10, 25, 40, 25]

    for i in range(30):
        route   = routes[i % len(routes)]
        vehicle = vehicles[i % len(vehicles)] if i < len(vehicles) else None

        priority  = random.choices(priorities, weights=p_weights)[0]
        urgency   = {"CRITICAL": 90, "HIGH": 70, "MEDIUM": 45, "LOW": 20}[priority] + random.uniform(-10, 10)
        progress  = random.uniform(0.02, 0.98)
        delay_min = 0

        if route["is_disrupted"] and random.random() < 0.6:
            status    = random.choice(["DELAYED", "AT_RISK", "REROUTED"])
            delay_min = random.randint(30, 240)
        elif progress > 0.95:
            status = "DELIVERED"
        else:
            status = "IN_TRANSIT"

        dep_offset = -int(route["base_duration_h"] * 60 * progress)
        arr_offset = int(route["current_duration_h"] * 60 * (1 - progress)) + delay_min

        shipments.append({
            "id": f"SH{i+1:03d}",
            "tracking_code": f"SSCIP{2024+i:04d}IN",
            "description": GOODS[i % len(GOODS)],
            "origin_name": route["origin_name"],
            "destination_name": route["destination_name"],
            "route_id": route["id"],
            "vehicle_id": vehicle["id"] if vehicle else "VH001",
            "status": status,
            "priority": priority,
            "urgency_score": round(_clamp(urgency, 0, 100), 1),
            "weight_kg": round(random.uniform(200, 25000), 0),
            "value_inr": round(random.uniform(50000, 5000000), 0),
            "departure_time": _iso_now(dep_offset),
            "expected_arrival": _iso_now(int(route["base_duration_h"] * 60 * (1-progress))),
            "estimated_arrival": _iso_now(arr_offset),
            "delay_minutes": delay_min,
            "progress": round(progress, 3),
        })

    return shipments


def generate_risk_assessment(routes: list[dict]) -> list[dict]:
    """Generate per-route AI risk assessments with factor breakdown."""
    assessments = []
    recs = [
        "Route performing normally. No action needed.",
        "Moderate traffic detected. Monitor closely.",
        "Consider alternate routing via bypass highways.",
        "HIGH RISK: Immediate rerouting recommended.",
        "Weather disruption ahead. Pre-stage at hub.",
    ]

    for route in routes:
        risk = route["risk_score"]
        rec_idx = 0 if risk < 20 else 1 if risk < 40 else 2 if risk < 60 else 3 if risk < 80 else 4

        factors = [
            {"name": "Traffic Congestion", "value": round(random.uniform(max(0,risk-30), min(100,risk+30)), 1), "weight": 0.35, "trend": random.choice(["UP","DOWN","STABLE"])},
            {"name": "Weather Severity",   "value": round(random.uniform(0, risk*0.8), 1),                     "weight": 0.25, "trend": random.choice(["UP","STABLE","STABLE"])},
            {"name": "Route Congestion",   "value": round(random.uniform(0, 60), 1),                           "weight": 0.20, "trend": random.choice(["DOWN","STABLE","UP"])},
            {"name": "Historical Delay",   "value": round(100 - random.uniform(50, 99), 1),                    "weight": 0.20, "trend": random.choice(["DOWN","DOWN","STABLE"])},
        ]

        assessments.append({
            "route_id": route["id"],
            "route_name": route["name"],
            "risk_score": risk,
            "delay_probability": route["delay_probability"],
            "factors": factors,
            "recommendation": recs[rec_idx],
            "confidence": round(random.uniform(0.75, 0.98), 2),
        })

    return assessments


def generate_alerts(routes: list[dict], shipments: list[dict]) -> list[dict]:
    """Generate a live alert feed from current route/shipment state."""
    alerts = []
    alert_id = 1

    for route in routes:
        if route["is_disrupted"]:
            alerts.append({
                "id": f"ALT{alert_id:04d}",
                "severity": "CRITICAL" if route["risk_score"] > 75 else "WARNING",
                "title": f"Disruption: {route['name']}",
                "message": f"Risk score {route['risk_score']:.0f}/100 — {route['traffic_level']} traffic, {route['weather_severity']} weather. Delay probability {route['delay_probability']*100:.0f}%.",
                "route_id": route["id"],
                "shipment_id": None,
                "timestamp": _iso_now(-random.randint(0, 30)),
                "is_read": random.random() < 0.3,
            })
            alert_id += 1

    for ship in shipments:
        if ship["status"] in ("DELAYED", "AT_RISK") and ship["delay_minutes"] > 60:
            alerts.append({
                "id": f"ALT{alert_id:04d}",
                "severity": "CRITICAL" if ship["priority"] == "CRITICAL" else "WARNING",
                "title": f"Shipment {ship['tracking_code']} Delayed",
                "message": f"{ship['description']} delayed by {ship['delay_minutes']} min. Priority: {ship['priority']}.",
                "route_id": ship["route_id"],
                "shipment_id": ship["id"],
                "timestamp": _iso_now(-random.randint(0, 60)),
                "is_read": False,
            })
            alert_id += 1

    # Add general AI-generated alerts
    ai_alerts = [
        ("INFO", "AI Prediction", "Congestion likely on NH-48 (Delhi-Mumbai) between 06:00–09:00 IST tomorrow."),
        ("INFO", "Route Optimized", "SmartRoute engine auto-rerouted 3 shipments via Pune bypass. Saving ~45 min each."),
        ("WARNING", "Weather Alert", "Heavy rainfall forecast in Kerala affecting Kochi Hub. Pre-stage recommended."),
    ]
    for sev, title, msg in ai_alerts:
        alerts.append({
            "id": f"ALT{alert_id:04d}",
            "severity": sev,
            "title": title,
            "message": msg,
            "route_id": None,
            "shipment_id": None,
            "timestamp": _iso_now(-random.randint(5, 120)),
            "is_read": random.random() < 0.5,
        })
        alert_id += 1

    alerts.sort(key=lambda a: a["timestamp"], reverse=True)
    return alerts[:20]  # Return latest 20


def generate_analytics(routes: list[dict], shipments: list[dict]) -> dict:
    """Generate analytics time-series and summary metrics."""
    delayed = [s for s in shipments if s["status"] in ("DELAYED", "AT_RISK")]
    on_time = [s for s in shipments if s["status"] not in ("DELAYED", "AT_RISK", "DELIVERED")]

    now = datetime.utcnow()

    def series(base, noise, n=12):
        pts = []
        for i in range(n):
            t = now - timedelta(hours=n - i)
            pts.append({"time": t.strftime("%H:%M"), "value": round(_noisy(base, noise), 1)})
        return pts

    city_heatmap = {c["id"]: round(random.uniform(0, 1), 2) for c in CITIES}
    for route in routes:
        if route["is_disrupted"]:
            city_heatmap[route["origin_id"]] = _clamp(city_heatmap[route["origin_id"]] + 0.3, 0, 1)

    return {
        "avg_delay_minutes": round(sum(s["delay_minutes"] for s in shipments) / max(len(shipments), 1), 1),
        "on_time_percent": round(len(on_time) / max(len(shipments), 1) * 100, 1),
        "total_shipments": len(shipments),
        "active_routes": len([r for r in routes if r["is_active"] and not r["is_disrupted"]]),
        "disrupted_routes": len([r for r in routes if r["is_disrupted"]]),
        "avg_cost_variance": round(random.uniform(-8, 22), 1),
        "delay_series": series(45, 0.4),
        "efficiency_series": series(78, 0.15),
        "cost_series": series(100, 0.12),
        "city_heatmap": city_heatmap,
    }


def generate_health_index(analytics: dict) -> dict:
    """Compute the Supply Chain Health Index."""
    on_time_score    = analytics["on_time_percent"]
    disruption_score = max(0, 100 - analytics["disrupted_routes"] * 12)
    delay_score      = max(0, 100 - analytics["avg_delay_minutes"] * 0.5)
    efficiency_score = analytics["efficiency_series"][-1]["value"] if analytics["efficiency_series"] else 75

    components = {
        "On-Time Delivery": round(on_time_score, 1),
        "Route Resilience": round(disruption_score, 1),
        "Delay Management": round(delay_score, 1),
        "Cost Efficiency":  round(efficiency_score, 1),
    }
    score = round(sum(components.values()) / len(components), 1)

    grade = (
        "EXCELLENT" if score >= 85 else
        "GOOD"      if score >= 70 else
        "FAIR"      if score >= 55 else
        "POOR"      if score >= 40 else
        "CRITICAL"
    )
    trend = random.choice(["UP", "DOWN", "STABLE", "STABLE"])

    return {"score": score, "grade": grade, "trend": trend, "components": components}


def simulate_whatif(route_id: str, failure_type: str, routes: list[dict], shipments: list[dict]) -> dict:
    """Simulate impact of a route failure and suggest reroutes."""
    affected = [s for s in shipments if s["route_id"] == route_id]
    cascade  = [s["id"] for s in affected[:5]]

    # Find alternates — routes with different origin/dest but similar endpoints
    target = next((r for r in routes if r["id"] == route_id), None)
    if not target:
        return {}

    delay_map = {"CLOSURE": 480, "SEVERE_DELAY": 180, "WEATHER": 120, "ACCIDENT": 90}
    delay = delay_map.get(failure_type, 120)

    alternates = [
        r for r in routes
        if r["id"] != route_id
        and (r["origin_id"] == target["origin_id"] or r["destination_id"] == target["destination_id"])
        and not r["is_disrupted"]
    ][:3]

    return {
        "affected_shipments": len(affected),
        "cascading_delays": cascade,
        "recommended_reroutes": alternates,
        "estimated_delay_minutes": delay,
        "cost_impact_inr": len(affected) * random.uniform(50000, 200000),
        "risk_increase": random.uniform(15, 40),
    }

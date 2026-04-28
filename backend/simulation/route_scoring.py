"""
Smart Route Scoring Engine
Risk Score = ETA(30%) + Traffic(25%) + Weather(20%) + Priority(15%) + Reliability(10%)
"""
import random, math
from datetime import datetime
from simulation.data_engine import CITIES, _clamp, _haversine

# ─── Lookup ───────────────────────────────────────────────────────────────────
def find_city(name: str):
    name = name.strip().lower()
    for c in CITIES:
        if c["name"].lower() == name or c["id"].lower() == name:
            return c
    for c in CITIES:
        if name in c["name"].lower():
            return c
    return None

# ─── Condition tables ─────────────────────────────────────────────────────────
WEATHER = {
    "CLEAR":         {"risk": 0,  "mult": 1.00, "icon": "☀️",  "desc": "Clear skies"},
    "LIGHT_RAIN":    {"risk": 15, "mult": 1.10, "icon": "🌦️", "desc": "Light rain"},
    "MODERATE_RAIN": {"risk": 40, "mult": 1.30, "icon": "🌧️", "desc": "Moderate rainfall"},
    "HEAVY_RAIN":    {"risk": 70, "mult": 1.60, "icon": "⛈️", "desc": "Heavy storm"},
    "FOG":           {"risk": 55, "mult": 1.40, "icon": "🌫️", "desc": "Dense fog"},
}

TRAFFIC = {
    "FREE_FLOW":  {"risk": 0,  "mult": 1.00, "icon": "🟢", "desc": "Free flow"},
    "LIGHT":      {"risk": 20, "mult": 1.15, "icon": "🟡", "desc": "Light traffic"},
    "MODERATE":   {"risk": 45, "mult": 1.40, "icon": "🟠", "desc": "Moderate congestion"},
    "HEAVY":      {"risk": 70, "mult": 1.70, "icon": "🔴", "desc": "Heavy congestion"},
    "STANDSTILL": {"risk": 95, "mult": 2.50, "icon": "⛔", "desc": "Near standstill"},
}

PRIORITY_W = {"CRITICAL": 1.0, "URGENT": 0.8, "HIGH": 0.6, "NORMAL": 0.4}

DISRUPTIONS = {
    "ACCIDENT":         {"delay_h": 2.5, "icon": "🚧", "desc": "Road accident blocking highway"},
    "TRAFFIC_SPIKE":    {"delay_h": 1.5, "icon": "🚦", "desc": "Sudden traffic surge detected"},
    "HEAVY_RAIN":       {"delay_h": 2.0, "icon": "🌧️", "desc": "Heavy rainfall — reduced visibility"},
    "ROAD_CLOSURE":     {"delay_h": 4.0, "icon": "⛔", "desc": "Route closed by authorities"},
    "VEHICLE_BREAKDOWN":{"delay_h": 1.0, "icon": "🔧", "desc": "Vehicle breakdown ahead"},
}

# ─── Simulation helpers ───────────────────────────────────────────────────────
def _weather(city_id: str) -> tuple[str, dict]:
    m = datetime.utcnow().month
    h = (datetime.utcnow().hour + 5) % 24
    monsoon  = 6 <= m <= 9
    winter   = m in [12, 1, 2]
    coastal  = city_id in ["MUM", "CHN", "KOC", "KOL"]
    northern = city_id in ["DEL", "LKO", "JAI", "AHM"]
    keys = list(WEATHER.keys())
    if winter and northern and h < 9:
        w = [20, 10, 5, 0, 65]
    elif monsoon and coastal:
        w = [15, 25, 35, 20, 5]
    elif monsoon:
        w = [35, 30, 25, 5, 5]
    else:
        w = [65, 20, 10, 2, 3]
    k = random.choices(keys, weights=w)[0]
    return k, WEATHER[k]

def _traffic() -> tuple[str, dict]:
    h = (datetime.utcnow().hour + 5) % 24
    peak = (7 <= h <= 10) or (17 <= h <= 21)
    keys = list(TRAFFIC.keys())
    w = [5, 15, 35, 35, 10] if peak else [40, 35, 20, 5, 0]
    k = random.choices(keys, weights=w)[0]
    return k, TRAFFIC[k]

def _score(base_h, reliability, traf, weath, priority) -> float:
    curr_h   = base_h * traf["mult"] * weath["mult"]
    eta_risk = _clamp((curr_h / base_h - 1.0) * 150, 0, 100)
    prio_risk = (1.0 - PRIORITY_W.get(priority, 0.4)) * 20
    rel_risk  = 100 - reliability
    return _clamp(
        eta_risk          * 0.30 +
        traf["risk"]      * 0.25 +
        weath["risk"]     * 0.20 +
        prio_risk         * 0.15 +
        rel_risk          * 0.10,
        0, 100
    )

def _reasoning(route, rank, priority) -> str:
    t = route["traffic"]; w = route["weather"]
    delay = route["delay_h"]
    prio_note = " ⚡ Priority override active." if priority == "CRITICAL" else \
                " 🚀 Urgent dispatch." if priority == "URGENT" else ""
    if rank == 1:
        return f"✅ RECOMMENDED — Best risk-adjusted corridor. {t['desc']}, {w['desc']}. Delay: +{delay:.1f}h.{prio_note}"
    if rank == 2:
        return f"⚠️ ALTERNATIVE — Viable via {route['highway']}. Adds distance but offers {t['desc']} conditions.{prio_note}"
    return f"🔄 CONTINGENCY — Use if Routes A & B are compromised. {w['desc']}, {t['desc']}.{prio_note}"

# ─── Route generation ─────────────────────────────────────────────────────────
def _make_routes(origin, dest) -> list:
    dist = _haversine(origin["lat"], origin["lng"], dest["lat"], dest["lng"])
    base_km = dist * 1.25
    base_h  = base_km / 65.0
    mid_lat = (origin["lat"] + dest["lat"]) / 2
    mid_lng = (origin["lng"] + dest["lng"]) / 2
    return [
        {"id":"A","name":"Route A — Direct Highway",
         "desc":"Fastest direct highway via major NH corridor",
         "distance_km":round(base_km),"base_h":round(base_h,1),
         "reliability":random.randint(82,94),"highway":"NH Primary",
         "waypoints":[{"lat":origin["lat"],"lng":origin["lng"]},
                      {"lat":mid_lat+random.uniform(-.5,.5),"lng":mid_lng+random.uniform(-.5,.5)},
                      {"lat":dest["lat"],"lng":dest["lng"]}]},
        {"id":"B","name":"Route B — Alternate NH",
         "desc":"Alternative corridor — avoids city centres",
         "distance_km":round(base_km*1.10),"base_h":round(base_h*1.08,1),
         "reliability":random.randint(75,88),"highway":"NH Secondary",
         "waypoints":[{"lat":origin["lat"],"lng":origin["lng"]},
                      {"lat":mid_lat+random.uniform(-1.5,1.5),"lng":mid_lng+random.uniform(-1.5,1.5)},
                      {"lat":dest["lat"],"lng":dest["lng"]}]},
        {"id":"C","name":"Route C — State Highways",
         "desc":"Longer route via state roads — lower congestion risk",
         "distance_km":round(base_km*1.22),"base_h":round(base_h*1.18,1),
         "reliability":random.randint(68,82),"highway":"State Highway",
         "waypoints":[{"lat":origin["lat"],"lng":origin["lng"]},
                      {"lat":mid_lat+random.uniform(-2,2),"lng":mid_lng+random.uniform(-2,2)},
                      {"lat":dest["lat"],"lng":dest["lng"]}]},
    ]

# ─── Public API ───────────────────────────────────────────────────────────────
def plan_route(source: str, destination: str, priority: str) -> dict:
    origin = find_city(source)
    dest   = find_city(destination)
    if not origin:
        return {"error": f"City '{source}' not found", "cities": [c["name"] for c in CITIES]}
    if not dest:
        return {"error": f"City '{destination}' not found", "cities": [c["name"] for c in CITIES]}
    if origin["id"] == dest["id"]:
        return {"error": "Source and destination must be different"}

    routes = _make_routes(origin, dest)
    scored = []
    for r in routes:
        tk, td = _traffic()
        wk, wd = _weather(origin["id"])
        # add slight per-route traffic variance
        td_var = {**td, "risk": _clamp(td["risk"] + random.uniform(-12, 12), 0, 100)}
        curr_h = r["base_h"] * td["mult"] * wd["mult"]
        rs     = _score(r["base_h"], r["reliability"], td_var, wd, priority)
        scored.append({
            **r,
            "current_h":       round(curr_h, 1),
            "delay_h":         round(max(0, curr_h - r["base_h"]), 1),
            "risk_score":      round(rs, 1),
            "composite_score": round(100 - rs, 1),
            "weather_key": wk, "weather": wd,
            "traffic_key": tk, "traffic": td_var,
            "factors": {
                "eta_risk":         round(_clamp((curr_h/r["base_h"]-1)*150, 0, 100), 1),
                "traffic_risk":     round(td_var["risk"], 1),
                "weather_risk":     round(wd["risk"], 1),
                "reliability":      r["reliability"],
            },
        })

    scored.sort(key=lambda x: x["risk_score"])
    for i, r in enumerate(scored):
        r["rank"] = i + 1
        r["reasoning"] = _reasoning(r, i + 1, priority)

    best = scored[0]
    return {
        "origin": origin, "destination": dest, "priority": priority,
        "routes": scored,
        "recommended_id": best["id"],
        "summary": f"Route {best['id']} selected — Risk {best['risk_score']:.0f}/100 · ETA {best['current_h']:.1f}h · {best['traffic']['desc']}",
        "ai_insight": (
            f"AI analysed 3 corridors. Route {best['id']} scores {best['composite_score']:.0f}/100 composite. "
            f"{'⚡ Activate priority lane — critical shipment.' if priority=='CRITICAL' else '🚀 Expedite dispatch.' if priority=='URGENT' else 'Standard dispatch protocol applies.'}"
        ),
    }


def simulate_reroute(route_id: str, disruption_type: str) -> dict:
    d = DISRUPTIONS.get(disruption_type, DISRUPTIONS["TRAFFIC_SPIKE"])
    alt_id   = "B" if route_id == "A" else "A"
    alt_name = "Alternate NH" if route_id == "A" else "Direct Highway"
    saved    = round(d["delay_h"] * random.uniform(0.5, 0.9), 1)
    sev      = "CRITICAL" if d["delay_h"] >= 3 else "WARNING"
    return {
        "disruption": {
            "type": disruption_type, "affected_route": route_id,
            "description": d["desc"], "icon": d["icon"],
            "estimated_delay_h": d["delay_h"],
        },
        "reroute": {
            "new_route_id": alt_id,
            "new_route_name": f"Route {alt_id} — {alt_name}",
            "time_saved_h": saved,
            "reason": f"{d['icon']} {d['desc']} on Route {route_id}. Switching to Route {alt_id} saves ~{saved:.1f}h.",
            "confidence": round(random.uniform(0.88, 0.97), 2),
        },
        "alert": {
            "severity": sev,
            "title":   f"⚠️ Rerouting — {d['desc']}",
            "message": f"Route {route_id} compromised. AI recommends Route {alt_id}. Net saving: {saved:.1f}h.",
        },
    }

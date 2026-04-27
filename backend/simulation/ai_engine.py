"""
Smart Supply Chain Intelligence Platform — AI Engine
Generates strategy recommendations and AI assistant responses.
"""

import random
from datetime import datetime


# ─── Strategy Templates ───────────────────────────────────────────────────────

STRATEGY_CONTEXTS = {
    "delay": {
        "keywords": ["delay", "late", "slow", "behind", "stuck"],
        "responses": [
            "**Delay Mitigation Strategy:**\n\n1. **Pre-emptive rerouting** — Activate alternate NH-48 bypass to reduce congestion exposure by ~35%.\n2. **Priority queue adjustment** — Elevate CRITICAL shipments to top of dispatch queue. Current ETA savings: 45–90 minutes.\n3. **Hub pre-staging** — Pre-position inventory at Pune and Hyderabad hubs to decouple downstream deliveries from upstream delays.\n4. **Carrier diversification** — Engage backup rail corridor (Mumbai–Chennai rail freight) for high-value cargo.\n\n*Confidence: 94% | Estimated time savings: 2.1 hours average*",
            "**AI Recommendation — Delay Response:**\n\nCurrent delay patterns suggest a systemic bottleneck near the Delhi–Jaipur corridor. Recommended actions:\n\n- **Reroute 6 shipments** via AHM–DEL express lane (saves 38 min avg)\n- **Alert downstream hubs** at Mumbai and Bengaluru for adjusted arrival windows\n- **Deploy reserve vehicle VH-009** from Lucknow standby pool\n\n*Risk reduction: 42% | Cost delta: +₹1.2L (justified by priority override)*",
        ]
    },
    "route": {
        "keywords": ["route", "path", "way", "alternate", "bypass", "reroute"],
        "responses": [
            "**Optimal Route Analysis:**\n\nAI has scored all 18 active corridors. Top recommendations:\n\n| Rank | Route | Score | Risk | ETA |\n|------|-------|-------|------|-----|\n| 🥇 | Mumbai → Bengaluru | 91.2 | LOW | 21h |\n| 🥈 | Delhi → Ahmedabad | 86.7 | LOW | 15h |\n| 🥉 | Hyderabad → Chennai | 82.1 | MODERATE | 10h |\n\nRoutes to avoid: **Delhi → Kolkata** (risk: 78/100) and **Kochi → Chennai** (weather: SEVERE).\n\n*Updated 30 seconds ago | Confidence: 97%*",
        ]
    },
    "risk": {
        "keywords": ["risk", "danger", "threat", "vulnerable", "disruption", "failure"],
        "responses": [
            "**Risk Landscape Summary:**\n\nCurrent threat assessment across 18 monitored corridors:\n\n- 🔴 **3 HIGH-RISK routes** require immediate attention\n- 🟡 **5 MODERATE-RISK routes** under active monitoring\n- 🟢 **10 routes** operating normally\n\n**Highest risk factors today:**\n1. Monsoon weather system approaching Kerala coast → Kochi Hub impact expected in 6–8 hours\n2. NH-44 accident reported near Nagpur → Hyderabad–Nagpur corridor +90 min delay\n3. Delhi NCR peak-hour congestion → All outbound routes +25–40 min\n\n*AI Prediction confidence: 91% | Next update: 3 minutes*",
        ]
    },
    "cost": {
        "keywords": ["cost", "expensive", "budget", "save", "efficient", "money", "price"],
        "responses": [
            "**Cost Optimization Playbook:**\n\n📊 **Current Cost Variance: +14.3%** above baseline (primary driver: delay penalties)\n\nRecommended optimizations:\n1. **Consolidate shipments** on Delhi → Mumbai corridor — 4 partial loads can be merged, saving ₹3.8L in fuel.\n2. **Night-routing** for non-urgent cargo avoids peak tolls and congestion surcharges (~₹12,000/trip).\n3. **Rail-first strategy** for Kolkata ↔ Delhi — rail is 40% cheaper for >10T loads with <24h flexibility window.\n\n*Projected monthly savings: ₹18–24L | Payback: Immediate*",
        ]
    },
    "strategy": {
        "keywords": ["strategy", "logistics", "plan", "best", "optimize", "improve", "suggestion"],
        "responses": [
            "**SmartChain AI — Strategic Logistics Brief:**\n\n🎯 **Today's Priority Actions:**\n\n1. **Reroute 3 critical shipments** away from Delhi–Kolkata corridor (risk score: 81/100)\n2. **Pre-position safety stock** at Chennai and Bengaluru hubs given Kerala weather alert\n3. **Activate dynamic pricing** for emergency carrier capacity on NH-48\n4. **Schedule predictive maintenance** for VH-007 and VH-013 (mileage threshold approaching)\n\n**Supply Chain Health: 72/100 — GOOD**\nTrend: ↑ Improving (up 4 points from yesterday)\n\n*AI Engine v2.4 | Data freshness: 12 seconds | Confidence: 95%*",
            "**Resilience-First Strategy Recommendation:**\n\nBased on current network topology and historical disruption patterns, I recommend a **Hub-and-Spoke Resilience Model**:\n\n- **Strengthen tier-1 buffer zones** at Delhi, Mumbai, Bengaluru (30-day safety stock)\n- **Establish dynamic rerouting contracts** with 3 alternate carriers\n- **Deploy IoT sensors** at high-risk bottleneck nodes (Nagpur, Bhopal junctions)\n- **AI monitoring cadence**: Reduce to 90-second refresh during monsoon season\n\n*Implementation timeline: 2–3 weeks | Risk reduction: 55%*",
        ]
    },
    "default": {
        "responses": [
            "**AI Supply Chain Assistant:**\n\nI'm analyzing your request against live supply chain data...\n\nCurrent network status:\n- ✅ **10 routes** operating optimally\n- ⚠️ **5 routes** under monitoring  \n- 🔴 **3 routes** with active disruptions\n\nSupply Chain Health Index: **72/100 (GOOD)**\n\nHow can I assist? You can ask me about:\n- Route optimization strategies\n- Risk mitigation plans\n- Cost reduction opportunities\n- Delay response playbooks\n- What-if failure scenarios",
        ]
    }
}

SUGGESTIONS = [
    "Suggest best route for critical shipments",
    "What's the current risk landscape?",
    "How can I reduce logistics costs?",
    "Analyze delay patterns this week",
    "What if Delhi-Mumbai route fails?",
    "Optimize my fleet deployment",
    "Show monsoon impact on supply chain",
    "Generate resilience improvement plan",
]


def generate_ai_response(message: str, context: str = None) -> dict:
    """Generate a contextual AI assistant response."""
    message_lower = message.lower()

    matched_category = "default"
    for category, data in STRATEGY_CONTEXTS.items():
        if category == "default":
            continue
        if any(kw in message_lower for kw in data.get("keywords", [])):
            matched_category = category
            break

    response_pool = STRATEGY_CONTEXTS[matched_category]["responses"]
    response      = random.choice(response_pool)

    # Pick related routes
    route_ids = [f"RT{random.randint(1,18):03d}" for _ in range(2)]

    return {
        "response": response,
        "suggestions": random.sample(SUGGESTIONS, 4),
        "related_routes": route_ids,
        "confidence": round(random.uniform(0.88, 0.98), 2),
    }

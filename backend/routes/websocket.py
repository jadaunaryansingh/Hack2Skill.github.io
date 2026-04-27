"""
WebSocket route — streams live supply chain data every 3 seconds.
Connect at: ws://localhost:8000/ws/live
"""

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from simulation.data_engine import (
    generate_routes, generate_fleet, generate_shipments,
    generate_analytics, generate_health_index, generate_alerts
)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/live")
async def live_feed(websocket: WebSocket):
    """
    Pushes a full snapshot every 3 seconds:
    { routes, fleet, shipments, alerts, analytics, health_index }
    """
    await websocket.accept()
    try:
        while True:
            routes     = generate_routes()
            fleet      = generate_fleet(routes)
            shipments  = generate_shipments(routes, fleet)
            analytics  = generate_analytics(routes, shipments)
            health     = generate_health_index(analytics)
            alerts     = generate_alerts(routes, shipments)

            payload = {
                "routes":       routes,
                "fleet":        fleet,
                "shipments":    shipments,
                "analytics":    analytics,
                "health_index": health,
                "alerts":       alerts,
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(3)

    except WebSocketDisconnect:
        pass

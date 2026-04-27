"""
Smart Supply Chain Intelligence Platform — FastAPI Backend
Entry point: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.supply_routes import router as supply_router
from routes.analytics     import router as analytics_router
from routes.risk          import router as risk_router
from routes.assistant     import router as assistant_router
from routes.websocket     import router as ws_router

app = FastAPI(
    title="Smart Supply Chain Intelligence Platform",
    description="AI-powered real-time logistics & route optimization backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS — allow Vite dev server ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ─────────────────────────────────────────────────────────
app.include_router(supply_router,   prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(risk_router,     prefix="/api")
app.include_router(assistant_router, prefix="/api")
app.include_router(ws_router)       # WebSocket has no prefix — mounts at /ws/live


@app.get("/", tags=["Health"])
def root():
    return {"status": "online", "platform": "Smart Supply Chain Intelligence Platform", "version": "1.0.0"}


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "healthy"}

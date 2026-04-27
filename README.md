# 🚀 Smart Supply Chain Intelligence Platform (SSCIP)

> AI-powered real-time logistics command center — predicting the future, reacting instantly.

## 📁 Project Structure

```
Hack2Skill/
├── frontend/                  ← React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── api/               ← API client (all fetch calls)
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── layout/        ← Sidebar, TopBar, StatusBar
│   │   │   ├── map/           ← LiveMapView (Leaflet)
│   │   │   └── notifications/ ← Toast alert system
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts ← Live data connection
│   │   ├── pages/             ← One file per page
│   │   │   ├── RiskPage.tsx
│   │   │   ├── RoutesPage.tsx
│   │   │   ├── ShipmentsPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   └── AssistantPage.tsx
│   │   ├── store/
│   │   │   └── supplyChainStore.ts ← Zustand global state
│   │   └── styles/
│   │       └── globals.css    ← Design system (neon + glass)
│   └── package.json
│
├── backend/                   ← FastAPI + Python
│   ├── main.py                ← App entry point
│   ├── routes/                ← API route files
│   │   ├── supply_routes.py   ← /api/routes, /api/fleet, /api/shipments
│   │   ├── risk.py            ← /api/risk, /api/alerts
│   │   ├── analytics.py       ← /api/analytics, /api/health-index
│   │   ├── assistant.py       ← /api/assistant/query
│   │   └── websocket.py       ← /ws/live (real-time stream)
│   ├── simulation/            ← Data generation engines
│   │   ├── data_engine.py     ← Routes, fleet, shipments, alerts
│   │   └── ai_engine.py       ← Risk scoring + AI responses
│   ├── models/
│   │   └── schemas.py         ← Pydantic data models
│   └── requirements.txt
│
└── README.md
```

## ⚡ Quick Start

### 1. Start Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/api/docs

### 2. Start Frontend (React + Vite)

```bash
cd frontend
npm install     # if not already done
npm run dev
```

Open: http://localhost:5173

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cities` | All logistics hub cities |
| GET | `/api/routes` | Routes with live AI scores |
| GET | `/api/fleet` | Fleet vehicle positions |
| GET | `/api/shipments` | Priority-sorted shipments |
| POST | `/api/whatif` | What-if failure simulation |
| GET | `/api/risk` | Per-route risk assessments |
| GET | `/api/alerts` | Live alert feed |
| GET | `/api/analytics` | Dashboard metrics + time-series |
| GET | `/api/health-index` | Supply Chain Health Score |
| POST | `/api/assistant/query` | AI strategy assistant |
| WS | `/ws/live` | Real-time data stream (3s intervals) |

## 🎨 Pages

| Page | URL | What it shows |
|------|-----|----------------|
| Live Map | `/` → `map` | Leaflet map, routes, fleet, disruptions |
| Risk Intel | `risk` | Route risk scores, alert feed |
| Route Optimizer | `routes` | Scored routes + What-If simulator |
| Shipments | `shipments` | Priority-sorted shipment table |
| Analytics | `analytics` | Recharts dashboards |
| AI Assistant | `assistant` | Strategy chatbot |

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript |
| State | Zustand |
| Maps | Leaflet + react-leaflet |
| Charts | Recharts |
| Animations | CSS keyframes + Framer Motion |
| Backend | FastAPI, Uvicorn |
| Real-time | WebSocket |
| Data | Python simulation engine |
